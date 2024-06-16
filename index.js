const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Default configuration
const defaultConfig = {
  MOMMY_CAREGIVER: "mommy",
  MOMMY_PRONOUNS: ["she", "her", "her"],
  MOMMY_SWEETIE: "girl",
  MOMMY_PREFIX: "",
  MOMMY_SUFFIX: "~",
  MOMMY_CAPITALIZE: "0",
  MOMMY_COLOR: "005",
  MOMMY_COMPLIMENTS: [
    "*pets your head*",
    "amazing work as always",
    "good %%SWEETIE%%",
    "good job, %%SWEETIE%%",
    "that's a good %%SWEETIE%%",
    "who's my good %%SWEETIE%%",
    "%%CAREGIVER%% is very proud of you",
    "%%CAREGIVER%% is so proud of you",
    "%%CAREGIVER%% knew you could do it",
    "%%CAREGIVER%% loves you, you are doing amazing",
    "%%CAREGIVER%%'s %%SWEETIE%% is so smart",
    "%%CAREGIVER%% thinks you deserve a special treat for that",
    "my little %%SWEETIE%% deserves a big fat kiss for that"
  ],
  MOMMY_COMPLIMENTS_EXTRA: [],
  MOMMY_COMPLIMENTS_ENABLED: "1",
  MOMMY_ENCOURAGEMENTS: [
    "%%CAREGIVER%% believes in you",
    "%%CAREGIVER%% knows you'll get there",
    "%%CAREGIVER%% knows %%THEIR%% little %%SWEETIE%% can do better",
    "just know that %%CAREGIVER%% still loves you",
    "don't worry, it'll be alright",
    "it's okay to make mistakes",
    "%%CAREGIVER%% knows it's hard, but it will be okay",
    "%%CAREGIVER%% is always here for you",
    "%%CAREGIVER%% is always here for you if you need %%THEM%%",
    "come here, sit on my lap while we figure this out together",
    "never give up, my love",
    "just a little further, %%CAREGIVER%% knows you can do it",
    "%%CAREGIVER%% knows you'll get there, don't worry about it",
    "did %%CAREGIVER%%'s %%SWEETIE%% make a big mess"
  ],
  MOMMY_ENCOURAGEMENTS_EXTRA: [],
  MOMMY_ENCOURAGEMENTS_ENABLED: "1",
  MOMMY_FORBIDDEN_WORDS: "",
  MOMMY_IGNORED_STATUSES: "130"
};

// Path to the config file in the same directory as the JS file
const configPath = path.join(__dirname, 'config.json');

// Function to create config file with default values
const createConfigFile = () => {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log(`Created default config file at: ${configPath}`);
};

// Read and apply user configuration or create config file if not exists
let config = {};
if (fs.existsSync(configPath)) {
  const userConfig = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(userConfig); // Apply user config
} else {
  createConfigFile();
  config = defaultConfig; // Apply default config
}

// String manipulation functions...
const replaceAll = (str, search, replacement) => {
  return str.split(search).join(replacement);
};

const splitPronouns = (pronouns) => {
  const [they, them, their] = pronouns.split(' ');
  return { they, them, their };
};

const listNormalize = (list) => {
  return list
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
};

const listChoose = (list) => {
  const randomIndex = crypto.randomInt(0, list.length);
  return list[randomIndex];
};

const fillTemplate = (template, sweetie, pronouns, caregiver, prefix, suffix, capitalize) => {
  const { they, them, their } = splitPronouns(pronouns);

  // Function to choose a sweetie from the list excluding prefixed ones
  const choose = (sweetieList, def) => {
    const filteredList = sweetieList.filter(item => !item.startsWith('#'));
    if (filteredList.length === 0) {
      return def;
    } else {
      return filteredList[Math.floor(Math.random() * filteredList.length)];
    }
  };

  let output = template
    .replace(/%%SWEETIE%%/g, choose(sweetie.split("/"), "girl"))
    .replace(/%%THEY%%/g, they)
    .replace(/%%THEM%%/g, them)
    .replace(/%%THEIR%%/g, their)
    .replace(/%%CAREGIVER%%/g, choose(caregiver.split("/"), "mommy"))
    .replace(/%%N%%/g, '\n')
    .replace(/%%S%%/g, '/');

  if (capitalize === '1') {
    output = output.charAt(0).toUpperCase() + output.slice(1);
  } else if (capitalize === '0') {
    output = output.charAt(0).toLowerCase() + output.slice(1);
  }

  // Ensure prefix spacing
  if (prefix && prefix.trim().length > 0 && prefix.trim().slice(-1) !== " ") {
    return `${prefix} ${output}${suffix}`;
  } else {
    return `${prefix}${output}${suffix}`;
  }
};



// Main function...
const main = () => {
  const args = process.argv.slice(2);
  let evalCommand = '';
  let status = '';

  args.forEach((arg, i) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      switch (key) {
        case '--help':
          console.log('Help page');
          process.exit(0);
        case '--version':
          console.log('mommyjs, v0.1, 6/16/2024');
          process.exit(0);
        case '--global-config-dirs':
          config.globalConfigDirs = value;
          break;
        case '--config':
          config.config = value;
          break;
        case '--eval':
          evalCommand = value;
          break;
        case '--status':
          status = value;
          break;
      }
    } else {
      switch (arg) {
        case '-h':
          console.log('Help page');
          process.exit(0);
        case '-v':
          console.log('mommyjs, v0.1, 6/16/2024');
          process.exit(0);
        case '-1':
          target = 1;
          break;
        case '-c':
          config.config = args[++i];
          break;
        case '-e':
          evalCommand = args[++i];
          break;
        case '-s':
          status = args[++i];
          break;
      }
    }
  });

  // Execute command...
  let commandExitCode = 0;
  if (evalCommand) {
    try {
      execSync(evalCommand, { stdio: 'inherit' });
    } catch (error) {
      commandExitCode = error.status || 1;
    }
  } else if (status) {
    commandExitCode = parseInt(status, 10);
  } else {
    try {
      execSync(args.join(' '), { stdio: 'inherit' });
    } catch (error) {
      commandExitCode = error.status || 1;
    }
  }

  const ignoredStatuses = listNormalize(config.MOMMY_IGNORED_STATUSES.split('\n'));
  if (ignoredStatuses.includes(commandExitCode.toString())) {
    process.exit(commandExitCode);
  }

  const templates = commandExitCode === 0 && config.MOMMY_COMPLIMENTS_ENABLED === "1"
    ? config.MOMMY_COMPLIMENTS.concat(config.MOMMY_COMPLIMENTS_EXTRA)
    : config.MOMMY_ENCOURAGEMENTS_ENABLED === "1"
      ? config.MOMMY_ENCOURAGEMENTS.concat(config.MOMMY_ENCOURAGEMENTS_EXTRA)
      : [];

  if (!templates.length) {
    process.exit(commandExitCode);
  }

  const forbiddenWords = listNormalize(config.MOMMY_FORBIDDEN_WORDS.split('\n'));
  const availableTemplates = templates.filter(line => !forbiddenWords.some(word => line.includes(word)));
  const template = listChoose(availableTemplates);
  const response = fillTemplate(template, config.MOMMY_SWEETIE, config.MOMMY_PRONOUNS.join(' '), config.MOMMY_CAREGIVER, config.MOMMY_PREFIX, config.MOMMY_SUFFIX, config.MOMMY_CAPITALIZE);
  console.log(response); // Colorize output if needed

  process.exit(commandExitCode);
};

main();
