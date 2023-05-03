import { inferAlias } from "$src/components/alias";
import {
  apiResultToLoginFlowResult,
  LoginFlowResult,
} from "$src/utils/flowResult";
import { Connection } from "$src/utils/iiConnection";
import { setAnchorUsed } from "$src/utils/userNumber";
import { unknownToString } from "$src/utils/utils";
import { UAParser } from "ua-parser-js";
import { promptCaptcha } from "./captcha";
import { displayUserNumber } from "./finish";
import { savePasskey } from "./passkey";

/** Registration (anchor creation) flow for new users */
export const register = async ({
  connection,
}: {
  connection: Connection;
}): Promise<LoginFlowResult> => {
  try {
    // TODO: this does not handle yubikeys etc
    const alias = inferAlias(new UAParser(navigator.userAgent)) ?? "Browser";

    // Kick-off the challenge request early, so that we might already
    // have a captcha to show once we get to the CAPTCHA screen
    const preloadedChallenge = connection.createChallenge();
    const identity = await savePasskey();

    const captchaResult = await promptCaptcha({
      connection,
      challenge: preloadedChallenge,
      identity,
      alias,
    });

    if ("tag" in captchaResult) {
      return captchaResult;
    } else {
      const result = apiResultToLoginFlowResult(captchaResult);
      if (result.tag === "ok") {
        await displayUserNumber(result.userNumber);
        setAnchorUsed(result.userNumber);
      }
      return result;
    }
  } catch (e) {
    return {
      tag: "err",
      title: "Failed to create anchor",
      message: "An error occurred during anchor creation.",
      detail: unknownToString(e, "unknown error"),
    };
  }
};
