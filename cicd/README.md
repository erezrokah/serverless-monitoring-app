# CICD process

## Setup (CodeBuild)

```bash
yarn connectToGitHubStaging --token ****************************
yarn storeAdminEmailStaging --value admin@email.com

yarn connectToGitHubProd --token ****************************
yarn storeAdminEmailProd --value admin@email.com
```

## Setup (CircleCI)

[Create a new CircleCI API Token](https://circleci.com/account/api) and run the following command (update relevant values)

```bash
yarn setup:circleci --token ************************************* --stagingAdminEmail admin@email.com --prodAdminEmail admin@email.com
```

To trigger a manual build run (use either `staging` or `prod` for `stage`)

```bash
yarn trigger:trigger --token ************************************* --stage staging|prod
```

To remove CircleCI setup

```bash
yarn remove:circleci --token *************************************
```
