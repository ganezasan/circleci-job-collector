import axios from 'axios';
import cliProgress from 'cli-progress';
import colors from 'colors';

export class ShowTiming {
  static requiredArgs = {
    '--jobSlug': String,
    '--stepName': String,
    '--stepNumber': Number,
  }

  static returnArgs = args => ({
    jobSlug: args['--jobSlug'],
    stepName: args['--stepName'],
    stepNumber: args['--stepNumber'],
  });

  constructor ({ baseHost, token, jobSlug, stepName, stepNumber }) {
    this.baseHost = baseHost;
    this.token = token;
    this.jobSlug = jobSlug;
    this.stepName = stepName;
    this.stepNumber = stepNumber;
    console.log(stepNumber)

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

  // sample: github/circleci/test-project/1 or bitbucket/circleci/test-project/1
  static validateJobSlug(jobSlug) {
    const values = jobSlug.split('/');
    return values.length === 4 || !values.includes('') || ['github','bitbucket'].includes(values[0]);
  }

  // all actions
  mergeAllActions (job) {
    return job.data.steps.reduce((mergedActions, s) => {
      if (mergedActions.length === 0) {
        mergedActions = s.actions.map(a => ({index: a.index, run_time_millis: a.run_time_millis }));
        return mergedActions;
      }

      if (s.actions[0].background === true) return mergedActions;

      return mergedActions.map(a => ({ index: a.index, run_time_millis: (a.run_time_millis + s.actions[a.index].run_time_millis)}));
    }, []);
  }

  // specific actions
  filterActions (job) {
    if (!this.stepName && (this.stepNumber === undefined || this.stepNumber >= job.data.steps.length)) {
      return Promise.reject(`${this.stepNumber} is wrong index in this job (${this.jobSlug})`);
    }

    const step = this.stepName ? job.data.steps.find(s => s.name === this.stepName) : job.data.steps[this.stepNumber];
    if (!step) return Promise.reject(`${this.stepName} step doesn't exist in this job (${this.jobSlug})`);

    return step.actions;
  }

  // fix the strings length
  fixLength({ str, length = 4}) {
    return `${[...Array(length - `${str}`.length).keys()].map(a => ' ').join('')}${str}`;
  }

  async exec () {
    const endpoint = `v1.1/project/${this.jobSlug}`;
    const job = await this.apiClient.get(endpoint);

    if (this.stepName) {
      console.log(`Step Name: ${this.stepName }`);
    } else if (this.stepNumber >= 0) {
      console.log(`Step Number: ${this.stepNumber }`);
    } else {
      console.log(`Step: All steps includes`);
    }

    console.log(`API URL: ${this.apiClient.defaults.baseURL}${endpoint}`);
    console.log(`JOB URL: ${this.baseHost}/${this.jobSlug}`);

    const actions = (this.stepName || this.stepNumber >= 0) ? this.filterActions(job) : this.mergeAllActions(job);

    const multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      format: '{index} [{bar}] {value}s'
    }, cliProgress.Presets.rect);
    const singleBar = new cliProgress.SingleBar({
      clearOnComplete: false,
      format: `${colors.green('{index}')} [${colors.green('{bar}')}] ${colors.green('{value}s')}`
    }, cliProgress.Presets.rect);

    const maximumSeconds = Math.max(...actions.map(a => a.run_time_millis))/1000;
    actions.forEach(action => {
      multiBar.create(maximumSeconds, action.run_time_millis/1000, { index: this.fixLength({ str: action.index })});
    });
    multiBar.stop();

    // show average value
    const avgSeconds = (actions.map(a => a.run_time_millis).reduce((a,b) => a+b)/1000/actions.length).toFixed(1);
    singleBar.start(maximumSeconds, avgSeconds, { index: this.fixLength({ str: 'Avg' }) });
    singleBar.stop();
  }
}
