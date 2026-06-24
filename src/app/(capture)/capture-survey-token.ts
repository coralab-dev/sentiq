type ResolveCaptureSurveyTokenInput = {
  queryToken: string | null;
  pathname: string | null;
  routePrefix: "s" | "d";
};

export function resolveCaptureSurveyToken({
  queryToken,
  pathname,
  routePrefix,
}: ResolveCaptureSurveyTokenInput): string | null {
  if (queryToken) {
    return queryToken;
  }

  const tokenSegment = getTokenSegmentFromPathname(pathname, routePrefix);

  if (!tokenSegment) {
    return null;
  }

  try {
    return decodeURIComponent(tokenSegment);
  } catch {
    return null;
  }
}

function getTokenSegmentFromPathname(
  pathname: string | null,
  routePrefix: "s" | "d",
): string | null {
  if (!pathname) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== routePrefix) {
    return null;
  }

  return segments[1] || null;
}
