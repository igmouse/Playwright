const isHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateUrlPayload = (body) => {
  const { url } = body ?? {};

  if (!isHttpUrl(url)) {
    return {
      ok: false,
      message: 'Invalid input: `url` must be a valid http/https URL.'
    };
  }

  return { ok: true, url };
};

module.exports = {
  validateUrlPayload
};
