import arg from 'arg';
import dotenv from 'dotenv';
import { FetchJobs } from './lib/fetchJobs';
import { Convert } from './lib/convert';
import { ShowTiming } from './lib/showTiming';
import { ShowSteps } from './lib/showSteps';
import { HELP } from './lib/help';

dotenv.config();

const parseArgumentsIntoOptions = ({ rawArgs, classObj }) => {
  const requiredArgs = classObj ? classObj.requiredArgs : { '--help': Boolean, '-h': '--help' };
  const returnArgs = classObj ? classObj.returnArgs : () => {};

  const excludeNodeAndCommandPath = 2;
  const args = arg({ ...requiredArgs },
    {
      argv: rawArgs.slice(excludeNodeAndCommandPath),
      permissive: true,
    }
  );
  return {
    ...returnArgs(args),
    help: args['--help'] || false,
    command: args._[0],
  };
};

const baseHost = process.env.CIRCLECI_HOST || 'https://circleci.com';

const runFetch = async () => {
  const { limit, offset, projectSlug, isServer } = parseArgumentsIntoOptions({ rawArgs: process.argv,  classObj: Fetch })

  if (!['CIRCLECI_TOKEN'].every(key => Object.keys(process.env).includes(key))) {
    throw new Error('Please set CIRCLECI_TOKEN as environment valiable');
  }

  if (projectSlug && ! Fetch.validateProjectSlug(projectSlug)) {
    throw new Error(`--project value ${projectSlug} is worng, please set the right format <github or bitbucket>/<org>/<project>`);
  }
  const fetch = new FetchJobs({ baseHost, token: process.env.CIRCLECI_TOKEN, limit, offset, isServer, projectSlug });
  await fetch.exec();
}

const runConvert = async () => {
  const { jobName, workflowName, inputFilename, outputFilename } = parseArgumentsIntoOptions({ rawArgs: process.argv,  classObj: Convert })

  if (!jobName || !workflowName) {
    throw new Error(`This command requires --jobName and --workflowName options`);
  }
  const convert = new Convert({ jobName, workflowName, inputFilename, outputFilename });
  await convert.exec();
}

const runShowTiming = async () => {
  const { jobSlug, stepName } = parseArgumentsIntoOptions({ rawArgs: process.argv,  classObj: ShowTiming })

  if (!jobSlug) {
    throw new Error(`This command requires --jobSlug`);
  }
  const showTiming = new ShowTiming({ jobSlug, stepName, baseHost, token: process.env.CIRCLECI_TOKEN });
  await showTiming.exec();
}

const runShowSteps = async () => {
  const { jobSlug } = parseArgumentsIntoOptions({ rawArgs: process.argv,  classObj: ShowSteps })

  if (!jobSlug) {
    throw new Error(`This command requires --jobSlug`);
  }
  const showSteps = new ShowSteps({ jobSlug, baseHost, token: process.env.CIRCLECI_TOKEN });
  await showSteps.exec();
}

const cli = async () => {
  const { command, help } = parseArgumentsIntoOptions({ rawArgs: process.argv });
  const commands = {
    fetch: runFetch,
    convert: runConvert,
    showTiming: runShowTiming,
    showSteps: runShowSteps
  };

  if (help) {
    console.log(HELP.join(''));
  } else if (command && commands[command]) {
    await commands[command]();
  } else {
    console.log('No command available, please run `cjc --help` command');
  }
};

export default cli;
