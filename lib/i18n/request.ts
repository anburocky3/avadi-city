import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Static or cookie/header-based locale resolution
  const locale = "en";

  return {
    locale,
    messages: (await import(`../../lang/${locale}.json`)).default,
  };
});
