import arg from 'arg';
import axios from 'axios';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const ganerateEndpoint = (isServer, projectSlug) => {
  if (projectSlug) return `v1.1/project/${projectSlug}`;
  return isServer ? 'v1/admin/recent-builds' : 'v1.1/recent-builds';
}

const fetchAllJobs = async ({ client, msec=100, maxJobNumber, defaultOffset = 0, isServer, projectSlug }) => {
  const endpoint = ganerateEndpoint(isServer, projectSlug);

  let offset = defaultOffset;
  const builds = [];
  const limit = maxJobNumber < 100 ? maxJobNumber : 100;
  while (true) {
    const option = {
      params: {
        offset,
        limit: maxJobNumber - (defaultOffset - offset) < limit ? maxJobNumber - (defaultOffset - offset) : limit,
      }
    };

    const recentBuilds = await client.get(endpoint, option);
    builds.push(...recentBuilds.data);
    offset += recentBuilds.data.length;
    console.log(offset);

    if (recentBuilds.data.length < limit || (offset-defaultOffset) >= maxJobNumber) {
      break;
    }
    await sleep(msec);
  }
  return builds;
}


// example http://<SERVER_DOMAIN>/gh/circleci/test-project/13 => /gh/circleci/test-project/13
const convertBuildUrlToBuildPath = (build_url, baseHost) => build_url.split(baseHost)[1];

const fetchAllJobDetails = async ({ client, recentBuilds, msec=100, baseHost }) => {
  const buildPathList = recentBuilds.map(b => convertBuildUrlToBuildPath(b.build_url, baseHost));
  const jobDetails = [];
  for (const buildPath of buildPathList) {
    const jobDetail = await client.get(`/v1.1/project${buildPath}`, {timeout: 5000});
    jobDetails.push(jobDetail);
    await sleep(msec);
    console.log(buildPath);
  }
  return jobDetails;
}

const parseArgumentsIntoOptions = rawArgs => {
  const excludeNodeAndCommandPath = 2;
  const args = arg(
    {
      '--limit': Number,
      '-l': '--limit',
      '--offset': Number,
      '--project': String,
      '--server': Boolean,
    },
    {
      argv: rawArgs.slice(excludeNodeAndCommandPath),
      permissive: true,
    }
  );
  return {
    limit: args['--limit'] || 1000,
    offset: args['--offset'] || 0,
    projectSlug: args['--project'] || '',
    isServer: args['--server'] || false,
  };
};

// sample: github/circleci/test-project or bitbucket/circleci/test-project
const validateProjectSlug = projectSlug => {
  const values = projectSlug.split('/');
  return values.length === 3 || !values.includes('') || ['github','bitbucket'].includes(values[0]);
}

(async () => {
  const { limit, offset, projectSlug, isServer } = parseArgumentsIntoOptions(process.argv);
  const baseHost = process.env.CIRCLECI_HOST || 'https://circleci.com';

  if (!['CIRCLECI_TOKEN'].every(key => Object.keys(process.env).includes(key))) {
    throw new Error('Please set CIRCLECI_TOKEN as environment valiable');
  }

  if (projectSlug && !validateProjectSlug(projectSlug)) {
    throw new Error(`--project value ${projectSlug} is worng, please set the right format <github or bitbucket>/<org>/<project>`);
  }

  const client = axios.create({
    baseURL: `${baseHost}/api/`,
    headers: {
      'Content-Type': 'application/json',
      'Circle-Token': `${process.env.CIRCLECI_TOKEN}`,
      'Accept': 'application/json',
    },
    responseType: 'json',
  });

  const recentBuilds = await fetchAllJobs({
    client,
    maxJobNumber: limit,
    defaultOffset: offset,
    isServer,
    projectSlug,
  });

  const jobDetails = await fetchAllJobDetails({ client, recentBuilds, baseHost });
  console.log(`The number of jobs: ${jobDetails.length}`);
  fs.writeFileSync('./jobs.json', JSON.stringify(jobDetails.map(j => j.data)));
})();
