import axios from 'axios';
import * as fs from 'fs';

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const ganerateEndpoint = (isServer, projectSlug) => {
  if (projectSlug) return `v1.1/project/${projectSlug}`;
  return isServer ? 'v1/admin/recent-builds' : 'v1.1/recent-builds';
}
// example http://<SERVER_DOMAIN>/gh/circleci/test-project/13 => /gh/circleci/test-project/13
const convertBuildUrlToBuildPath = (build_url, baseHost) => build_url.split(baseHost)[1];

export class FetchJobs {
  static requiredArgs = {
    '--limit': Number,
    '-l': '--limit',
    '--offset': Number,
    '--project': String,
    '--server': Boolean,
  }

  static returnArgs = args => ({
    limit: args['--limit'] || 1000,
    offset: args['--offset'] || 0,
    projectSlug: args['--project'] || '',
    isServer: args['--server'] || false,
  });

  constructor ({ baseHost, token, limit, offset, isServer, projectSlug }) {
    this.msec = 100;
    this.baseHost = baseHost;
    this.token = token;
    this.maxJobNumber = limit;
    this.defaultOffset = offset;
    this.isServer = isServer;
    this.projectSlug = projectSlug;

    this.apiClient = axios.create({
      baseURL: `${baseHost}/api/`,
      headers: {
        'Content-Type': 'application/json',
        'Circle-Token': token,
        'Accept': 'application/json',
      },
      responseType: 'json',
    });
  }

  // sample: github/circleci/test-project or bitbucket/circleci/test-project
  static validateProjectSlug(projectSlug) {
    const values = projectSlug.split('/');
    return values.length === 3 || !values.includes('') || ['github','bitbucket'].includes(values[0]);
  }

  async fetchAllJobs () {
    const endpoint = ganerateEndpoint(this.isServer, this.projectSlug);
  
    let offset = this.defaultOffset;
    const builds = [];
    const limit = this.maxJobNumber < 100 ? this.maxJobNumber : 100;
    while (true) {
      const option = {
        params: {
          offset,
          limit: this.maxJobNumber - this.defaultOffset - offset < limit ? this.maxJobNumber - this.defaultOffset - offset : limit,
        }
      };
  
      const recentBuilds = await this.apiClient.get(endpoint, option);
      builds.push(...recentBuilds.data);
      offset += recentBuilds.data.length;
      console.log(offset);
  
      if (recentBuilds.data.length < limit || (offset - this.defaultOffset) >= this.maxJobNumber) {
        break;
      }
      await sleep(this.msec);
    }
    return builds;
  }

  async fetchAllJobDetailsAndWrite ({ recentBuilds, filename }) {
    const buildPathList = recentBuilds.map(b => convertBuildUrlToBuildPath(b.build_url, this.baseHost));
    const jobDetails = [];
    for (const buildPath of buildPathList) {
      const jobDetail = await this.apiClient.get(`/v1.1/project${buildPath}`, {timeout: 5000});
      jobDetails.push(jobDetail);
      await sleep(this.msec);
      console.log(buildPath);
    }
    return jobDetails;
  }
  
  async exec () {
    const filename = 'jobs.json';
    const recentBuilds = await this.fetchAllJobs();
    const jobDetails = await this.fetchAllJobDetailsAndWrite({ recentBuilds, filename });
    console.log(`The number of jobs: ${jobDetails.length}`);
    fs.writeFileSync('./jobs.json', JSON.stringify(jobDetails.map(j => j.data)));
  }
}
