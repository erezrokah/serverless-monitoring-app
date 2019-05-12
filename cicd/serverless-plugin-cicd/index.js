'use strict';

let stage;

class CICDPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');

    /* Hooks tell Serverless when to do what */
    this.hooks = {
      'before:package:initialize': this.update.bind(this),
    };
  }

  /**
   * Updates CloudFormation resources with CICD
   */
  update() {
    const service = this.serverless.service;
    stage =
      this.options.stage && this.options.stage.length > 0
        ? this.options.stage
        : service.provider.stage;
    if (service.custom.cicd) {
      if (
        service.custom.cicd.excludestages &&
        service.custom.cicd.excludestages.includes('stage')
      ) {
        this.serverless.cli.log(`CICD is ignored for ${stage} stage`);
        return;
      }
    }

    this.serverless.cli.log('Updating CICD Resources...');
    const resource = this.create();
    if (this.serverless.service.resources === undefined) {
      this.serverless.service.resources = {
        Resources: {},
      };
    } else if (this.serverless.service.resources.Resources === undefined) {
      this.serverless.service.resources.Resources = {};
    }

    this.serverless.service.resources.Resources = {
      ...this.serverless.service.resources.Resources,
      ...resource,
    };
    this.serverless.cli.log('CICD Resources Updated');
  }

  getOptionOrThrowError(options, name, errorPrefix) {
    if (options[name]) {
      return options[name];
    } else {
      throw new Error(`Missing required option ${errorPrefix}.${name}`);
    }
  }

  /**
   * Creates CloudFormation resources object with CICD Role, CodeBuild, CodePipeline
   * @return {Object} resources object
   */
  create() {
    const service = this.serverless.service;
    const serviceName = service.service;
    let image = '';
    let gitOwner = '';
    let gitRepo = '';
    let stageSettings = {};

    let filterGroups = [];

    if (service.custom.cicd) {
      image = this.getOptionOrThrowError(service.custom.cicd, 'image', 'cicd');
      gitOwner = this.getOptionOrThrowError(
        service.custom.cicd,
        'owner',
        'cicd',
      );
      gitRepo = this.getOptionOrThrowError(
        service.custom.cicd,
        'repository',
        'cicd',
      );
      stageSettings = this.getOptionOrThrowError(
        service.custom.cicd,
        stage,
        'cicd',
      );
      if (stageSettings.buildOnPullRequest) {
        filterGroups.push([
          {
            Type: 'EVENT',
            Pattern: 'PULL_REQUEST_CREATED, PULL_REQUEST_UPDATED',
          },
          {
            Type: 'BASE_REF',
            Pattern: `^refs/heads/${stageSettings.buildOnPullRequest}$`,
            ExcludeMatchedPattern: false,
          },
        ]);
      }
      if (stageSettings.buildOnPush) {
        filterGroups.push([
          {
            Type: 'EVENT',
            Pattern: 'PUSH',
          },
          {
            Type: 'HEAD_REF',
            Pattern: `^refs/heads/${stageSettings.buildOnPush}$`,
            ExcludeMatchedPattern: false,
          },
        ]);
      }
      if (stageSettings.buildOnTag) {
        filterGroups.push([
          {
            Type: 'EVENT',
            Pattern: 'PUSH',
          },
          {
            Type: 'HEAD_REF',
            Pattern: `^refs/tags/${stageSettings.buildOnTag}$`,
            ExcludeMatchedPattern: false,
          },
        ]);
      }
    } else {
      return {};
    }

    const environmentVariables = [
      {
        Name: 'STAGE',
        Value: `${stage}`,
      },
    ];

    // This role has a lot of access, but depending what you do with your buildspec
    // it might be needed!
    const role = {
      CICDRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `${serviceName}-${stage}`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: ['codebuild.amazonaws.com'],
                },
                Action: ['sts:AssumeRole'],
              },
            ],
          },
          Policies: [
            {
              PolicyName: `${serviceName}-${stage}`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'elasticbeanstalk:*',
                      'ec2:*',
                      'elasticloadbalancing:*',
                      'autoscaling:*',
                      'cloudwatch:*',
                      's3:*',
                      'sns:*',
                      'cloudformation:*',
                      'rds:*',
                      'sqs:*',
                      'ecs:*',
                      'codedeploy:*',
                      'codecommit:*',
                      'codebuild:*',
                      'codepipeline:*',
                      'lambda:*',
                      'opsworks:*',
                      'logs:*',
                      'apigateway:*',
                      'kinesis:*',
                      'dynamodb:*',
                      'events:*',
                      'iam:*',
                      'ssm:*',
                      'cognito-idp:*',
                      'states:*',
                      'appsync:*',
                      'cloudfront:*',
                    ],
                    Resource: '*',
                  },
                ],
              },
            },
          ],
        },
      },
    };

    const build = {
      CICDBUILD: {
        Type: 'AWS::CodeBuild::Project',
        Properties: {
          Name: `${serviceName}-${stage}`,
          ServiceRole: {
            'Fn::GetAtt': ['CICDRole', 'Arn'],
          },
          Artifacts: {
            Type: 'NO_ARTIFACTS',
          },
          Environment: {
            Type: 'LINUX_CONTAINER',
            ComputeType: 'BUILD_GENERAL1_SMALL',
            Image: `${image}`,
            EnvironmentVariables: environmentVariables,
          },
          Source: {
            Type: 'GITHUB',
            Location: `https://github.com/${gitOwner}/${gitRepo}.git`,
            ReportBuildStatus: true,
          },
          TimeoutInMinutes: 60,
          Triggers: {
            Webhook: true,
            FilterGroups: filterGroups,
          },
        },
      },
    };

    return {
      ...role,
      ...build,
    };
  }
}

module.exports = CICDPlugin;
