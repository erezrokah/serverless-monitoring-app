'use strict';

const baseImage = 'aws/codebuild/ubuntu-base:14.04';
const nodeImage = 'aws/codebuild/nodejs:6.3.1';
const pythonImage = 'aws/codebuild/python:3.5.2';
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

  /**
   * Creates CloudFormation resources object with CICD Role, CodeBuild, CodePipeline
   * @return {Object} resources object
   */
  create() {
    const service = this.serverless.service;
    const serviceName = service.service;
    let image = baseImage;
    let gitOwner = '';
    let gitRepo = service.name;
    let gitBranch = 'master';
    let githubOAuth = '';
    let artifactStoreBucket = `${serviceName}-artifact-store-${stage}`;

    if (service.custom[stage]) {
      gitBranch = service.custom[stage].branch;
    }

    if (service.custom.cicd) {
      if (service.custom.cicd.image != null) {
        image = service.custom.cicd.image;
      } else if (service.provider.runtime.includes('node')) {
        image = nodeImage;
      } else if (service.provider.runtime.includes('python')) {
        image = pythonImage;
      }

      gitOwner = service.custom.cicd.owner || '';
      gitRepo = service.custom.cicd.repository || gitRepo;
      gitBranch = service.custom.cicd.branch || gitBranch;
      githubOAuth = service.custom.cicd.githubtoken || '';
      artifactStoreBucket =
        service.custom.cicd.artifactStoreBucket || artifactStoreBucket;
    }

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
                  Service: ['codepipeline.amazonaws.com'],
                },
                Action: ['sts:AssumeRole'],
              },
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
      Build: {
        Type: 'AWS::CodeBuild::Project',
        Properties: {
          Name: `${serviceName}-${stage}`,
          ServiceRole: {
            'Fn::GetAtt': ['CICDRole', 'Arn'],
          },
          Artifacts: {
            Type: 'CODEPIPELINE',
            Name: `${serviceName}-${stage}-build`,
            Packaging: 'NONE',
          },
          Environment: {
            Type: 'LINUX_CONTAINER',
            ComputeType: 'BUILD_GENERAL1_SMALL',
            Image: `${image}`,
            EnvironmentVariables: [
              {
                Name: 'STAGE',
                Value: `${stage}`,
              },
            ],
          },
          Source: {
            Type: 'CODEPIPELINE',
          },
          TimeoutInMinutes: 60,
        },
      },
    };

    const bucket = {
      ArtifactStoreBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: artifactStoreBucket,
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
        },
      },
    };

    const pipeline = {
      Pipeline: {
        Type: 'AWS::CodePipeline::Pipeline',
        Properties: {
          Name: `${serviceName}-${stage}`,
          RoleArn: {
            'Fn::GetAtt': ['CICDRole', 'Arn'],
          },
          Stages: [
            {
              Name: 'Source',
              Actions: [
                {
                  Name: 'Source',
                  ActionTypeId: {
                    Category: 'Source',
                    Owner: 'ThirdParty',
                    Version: '1',
                    Provider: 'GitHub',
                  },
                  OutputArtifacts: [{ Name: `${serviceName}` }],
                  Configuration: {
                    Owner: `${gitOwner}`,
                    Repo: `${gitRepo}`,
                    Branch: `${gitBranch}`,
                    OAuthToken: `${githubOAuth}`,
                  },
                  RunOrder: '1',
                },
              ],
            },
            {
              Name: 'Build',
              Actions: [
                {
                  Name: 'CodeBuild',
                  InputArtifacts: [{ Name: `${serviceName}` }],
                  ActionTypeId: {
                    Category: 'Build',
                    Owner: 'AWS',
                    Version: '1',
                    Provider: 'CodeBuild',
                  },
                  OutputArtifacts: [{ Name: `${serviceName}Build` }],
                  Configuration: {
                    ProjectName: {
                      Ref: 'Build',
                    },
                  },
                  RunOrder: '1',
                },
              ],
            },
          ],
          ArtifactStore: {
            Type: 'S3',
            Location: { Ref: 'ArtifactStoreBucket' },
          },
        },
      },
    };

    return { ...role, ...build, ...bucket, ...pipeline };
  }
}

module.exports = CICDPlugin;
