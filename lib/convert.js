import * as fs from 'fs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc)

export class Convert {

  static requiredArgs = {
    '--inputFilename': String,
    '--outputFilename': String,
    '--workflowName': String,
    '-w': '--workflowName',
    '--jobName': String,
    '-j': '--jobName',
  }

  static returnArgs = args => ({
    inputFilename: args['--inputFilename'] || './jobs.json',
    outputFilename: args['--outputFilename'] || './summary.csv',
    workflowName: args['--workflowName'],
    jobName: args['--jobName'],
  });

  constructor({ inputFilename, workflowName, jobName, outputFilename }) {
    this.json = JSON.parse(fs.readFileSync(inputFilename));
    this.inputFilename = inputFilename;
    this.workflowName = workflowName;
    this.jobName = jobName;
    this.outputFilename = outputFilename;
  }

  // this is for parallelism
  makeAvgTimeByActions({ steps, stepNames }) {
    return stepNames.reduce((hash, stepName) => {
      const step = steps.find(s => s.name === stepName);
      if (!step) {
        hash[stepName] = '-';
      } else {
        const avgTime = step.actions.map(a => Number(a.run_time_millis)).reduce((a,b) => a+b)/1000/step.actions.length;
        hash[stepName] = avgTime;  
      }
      return hash;
    }, {});
  }

  makeAvgTimeBySteps({ jobs, stepNames }) {
    return jobs.reduce((list, j) => {
      const avgTimes = this.makeAvgTimeByActions({ steps: j.steps, stepNames });
      const start = dayjs(j.start_time);
      list.push({
        date: start.format('YYYY-MM-DD'),
        start: start.utc().format(),
        ...avgTimes,
        branch: j.branch,
        build_url: j.build_url,
        resource_class: j.picard ? j.picard.resource_class.name : '-',
      });
      return list;
    }, []);
  }

  makeStepNames(jobs) {
    const stepNameHash = jobs.reduce((steps, j) => {
      j.steps.forEach(s => {
        if (steps[s.name] === undefined) steps[s.name] = s.index;
      });
      return steps;
    }, {});

    return Object.keys(stepNameHash).map(k => ({stepName: k, index: stepNameHash[k]})).sort((a, b) => {
      if(a.index < b.index) return -1;
      if(a.index > b.index) return 1;
      return 0;
    }).map(s => s.stepName);
  }
  
  writeDataToCsv({ header, data, filename }) {
    const csv = [header, ...data].map((d,i) => {
      if (i === 0) return `${header.join(',')}`;
      return `${header.map(h => d[h]).join(',')}`;
    });

    fs.writeFileSync(filename, csv.join('\n'));
  }

  async exec () {
    const filteredJobs = this.json.filter(j => (j.status !== "not_run" && j.workflows.workflow_name === this.workflowName && (j.workflows.job_name === this.jobName)));

    if (filteredJobs.length === 0) return console.log(`No jobs match the current condition (workflowName=${this.workflowName}, jobName=${this.jobName}), ${this.inputFilename} has ${this.json.length} records`);

    const stepNames = this.makeStepNames(filteredJobs);
    const data = this.makeAvgTimeBySteps({ jobs: filteredJobs,  stepNames });

    const header = ['date', 'start', 'branch', 'build_url', 'resource_class', ...stepNames];

    this.writeDataToCsv({ header, data, filename: this.outputFilename });

    console.log(`Convert ${this.inputFilename} to ${this.outputFilename}`);
  }
}


