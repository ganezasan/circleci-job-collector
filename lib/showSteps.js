import axios from 'axios';

export class ShowSteps {
  static requiredArgs = {
    '--jobSlug': String,
  }

  static returnArgs = args => ({
    jobSlug: args['--jobSlug'],
  });

  constructor ({ baseHost, token, jobSlug }) {
    this.baseHost = baseHost;
    this.token = token;
    this.jobSlug = jobSlug;

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

  async exec () {
    const endpoint = `v1.1/project/${this.jobSlug}`;
    const job = await this.apiClient.get(endpoint);

    job.data.steps.forEach((s, i) => console.log(`${i}: ${s.name}`));
  }
}
