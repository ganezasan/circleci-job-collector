import arg from 'arg';
import axios from 'axios';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = axios.create({
  baseURL: `${process.env.CIRCLECI_HOST}/api/`,
  headers: {
    'Content-Type': 'application/json',
    'Circle-Token': `${process.env.CIRCLECI_TOKEN}`,
    'Accept': 'application/json',
  },
  responseType: 'json',
});

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

const fetchAllJobs = async ({ msec=100, maxJobNumber }) => {
  let offset = 0;
  const builds = [];
  const limit = maxJobNumber < 100 ? maxJobNumber : 100;
  while (true) {
    const option = {
      params: {
        offset,
        limit: maxJobNumber - offset < limit ? maxJobNumber - offset : limit,
      }
    };

    const recentBuilds = await client.get('v1/admin/recent-builds', option);
    builds.push(...recentBuilds.data);
    offset += recentBuilds.data.length;
    console.log(offset);

    if (recentBuilds.data.length < limit || offset >= maxJobNumber) {
      break;
    }
    await sleep(msec);
  }
  return builds;
}


// example http://<SERVER_DOMAIN>/gh/circleci/test-project/13 => /gh/circleci/test-project/13
const convertBuildUrlToBuildPath = (build_url) => build_url.split(process.env.CIRCLECI_HOST)[1];

const fetchAllJobDetails = async (recentBuilds, msec=100) => {
  const buildPathList = recentBuilds.map(b => convertBuildUrlToBuildPath(b.build_url));
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
    },
    {
      argv: rawArgs.slice(excludeNodeAndCommandPath),
      permissive: true,
    }
  );
  return {
    limit: args['--limit'] || 1000,
  };
};

(async () => {
  const { limit } = parseArgumentsIntoOptions(process.argv);

  if (!['CIRCLECI_HOST', 'CIRCLECI_TOKEN'].every(key => Object.keys(process.env).includes(key))) {
    throw new Error('Please set CIRCLECI_HOST and CIRCLECI_TOKEN as environment valiable');
  }

  const recentBuilds = await fetchAllJobs({maxJobNumber: limit}); 
  const jobDetails = await fetchAllJobDetails(recentBuilds);
  console.log(`The number of jobs: ${jobDetails.length}`);
  fs.writeFileSync('./jobs.json', JSON.stringify(jobDetails.map(j => j.data)));
})();

