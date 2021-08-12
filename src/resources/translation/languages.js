import { logger } from "sc-common";

const defaultLanuage = "en-US";
const supportedLanguages = ["en-US", "id-ID", "th-TH", "zh-CN", "zh-TW"];

const loadLanguage = async (language) => {
  let resource = {};
  try {
    const isLanguageSupported = supportedLanguages.filter((lang) => lang === language).length !== 0;
    language = isLanguageSupported ? language : defaultLanuage;
    const data = await import(`./${language}.js`);
    resource = data.default;
  } catch (e) {
    logger.logError(e);
  }

  return resource;
};

export { loadLanguage };
