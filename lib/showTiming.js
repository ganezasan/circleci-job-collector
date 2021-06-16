import axios from 'axios';
import cliProgress from 'cli-progress';
import colors from 'colors';

export class ShowTiming {
  static requiredArgs = {
    '--jobSlug': String,
    '--stepName': String,
  }

  static returnArgs = args => ({
    jobSlug: args['--jobSlug'],
    stepName: args['--stepName'],
  });

  constructor ({ baseHost, token, jobSlug, stepName }) {
    this.baseHost = baseHost;
    this.token = token;
    this.jobSlug = jobSlug;
    this.stepName = stepName

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
    const step = job.data.steps.find(s => s.name === this.stepName);
    if (!step) Promise.reject(`${this.stepName} step doesn't exist in this job (${this.jobSlug})`);

    return step.actions;
  }

  // fix the strings length
  fixLength({ str, length = 4}) {
    return `${[...Array(length - `${str}`.length).keys()].map(a => ' ').join('')}${str}`;
  }

  async exec () {
    const endpoint = `v1.1/project/${this.jobSlug}`;
    const job = await this.apiClient.get(endpoint);

    console.log(`Step: ${this.stepName ? this.stepName : 'All steps includes'}`);
    console.log(`API URL: ${this.apiClient.defaults.baseURL}${endpoint}`);
    console.log(`JOB URL: ${this.baseHost}/${this.jobSlug}`);

    const actions = this.stepName ? this.filterActions(job) : this.mergeAllActions(job);

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
