import arg from 'arg';
import dotenv from 'dotenv';
import { FetchJobs } from './lib/fetchJobs';
import { HELP } from './lib/help';

dotenv.config();

const parseArgumentsIntoOptions = rawArgs => {
  const excludeNodeAndCommandPath = 2;
  const args = arg(
    {
      '--help': Boolean,
      '-h': '--help',
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
    help: args['--help'] || false,
    command: args._[0],
  };
};

// sample: github/circleci/test-project or bitbucket/circleci/test-project
const validateProjectSlug = projectSlug => {
  const values = projectSlug.split('/');
  return values.length === 3 || !values.includes('') || ['github','bitbucket'].includes(values[0]);
}

const runFetch = async ({ limit, offset, projectSlug, isServer }) => {
  const baseHost = process.env.CIRCLECI_HOST || 'https://circleci.com';

  if (!['CIRCLECI_TOKEN'].every(key => Object.keys(process.env).includes(key))) {
    throw new Error('Please set CIRCLECI_TOKEN as environment valiable');
  }

  if (projectSlug && !validateProjectSlug(projectSlug)) {
    throw new Error(`--project value ${projectSlug} is worng, please set the right format <github or bitbucket>/<org>/<project>`);
  }
  const fetch = new FetchJobs({ baseHost, token: process.env.CIRCLECI_TOKEN, limit, offset, isServer, projectSlug });
  await fetch.exec();
}

const cli = async () => {
  const { command, help, ...args } = parseArgumentsIntoOptions(process.argv);
  const commands = {
    fetch: runFetch,
  };

  if (help) {
    console.log(HELP.join(''));
  } else if (command && commands[command]) {
    await commands[command](args);
  } else {
    console.log('No command available, please run `cjc --help` command');
  }
};

export default cli;
