import { Connection } from "../../utils/iiConnection";
import { unknownToString } from "../../utils/utils";
import { confirmRegister } from "./captcha";
import { makeCaptcha } from "./captcha";
import { LoginFlowResult, cancel } from "../login/flowResult";
import { constructIdentity } from "./construct";
import { promptDeviceAlias } from "./alias";
import { pickDeviceType } from "./deviceType";

/** Registration (anchor creation) flow for new users */
export const register = async ({
  connection,
}: {
  connection: Connection;
}): Promise<LoginFlowResult> => {
  try {
    const deviceType = await pickDeviceType();

    const [captcha, identity] = await Promise.all([
      makeCaptcha(connection),
      constructIdentity(deviceType),
    ]);

    let placeholder = undefined;

    if (deviceType === "platform") {
      placeholder = "TouchID on Mac";
    } else if (deviceType === "cross-platform") {
      placeholder = "YubiKey";
    }

    const alias = await promptDeviceAlias({ placeholder });
    if (alias === null) {
      return cancel;
    }

    const result = await confirmRegister(
      connection,
      Promise.resolve(captcha),
      identity,
      alias
    );

    return result;
  } catch (e) {
    return {
      tag: "err",
      title: "Failed to create anchor",
      message: "An error occurred during anchor creation.",
      detail: unknownToString(e, "unknown error"),
    };
  }
};
