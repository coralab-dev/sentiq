"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { PublicDeviceSurvey } from "@/features/capture/components/public-device-survey";
import { PublicQrSurvey } from "@/features/capture/components/public-qr-survey";
import { resolveCaptureSurveyToken } from "./capture-survey-token";

export function BranchSurveySearchParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = resolveCaptureSurveyToken({
    queryToken: searchParams.get("token"),
    pathname,
    routePrefix: "s",
  });

  return <PublicQrSurvey token={token} />;
}

export function DeviceSurveySearchParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = resolveCaptureSurveyToken({
    queryToken: searchParams.get("token"),
    pathname,
    routePrefix: "d",
  });

  return <PublicDeviceSurvey token={token} />;
}
