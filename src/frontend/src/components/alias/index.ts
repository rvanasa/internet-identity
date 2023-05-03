import { mainWindow } from "$src/components/mainWindow";
import { I18n } from "$src/i18n";
import { renderPage, withRef } from "$src/utils/lit-html";
import { validateAlias } from "$src/utils/validateAlias";
import { nonNullish } from "@dfinity/utils";
import { html, TemplateResult } from "lit-html";
import { ifDefined } from "lit-html/directives/if-defined.js";
import { createRef, ref, Ref } from "lit-html/directives/ref.js";
import { UAParser } from "ua-parser-js";

import copyJson from "./index.json";

/* Everything (template, component, page) related to picking a device alias */

export const promptDeviceAliasTemplate = (props: {
  title: string;
  defaultAlias?: string;
  message?: string | TemplateResult;
  cancelText?: string;
  continue: (alias: string) => void;
  cancel: () => void;
  i18n: I18n;
}): TemplateResult => {
  const copy = props.i18n.i18n(copyJson);

  const aliasInput: Ref<HTMLInputElement> = createRef();
  const promptDeviceAliasSlot = html`
    <hgroup class="t-centered">
      <h1 class="t-title t-title--main">${props.title}</h1>
      <p class="t-lead t-paragraph l-stack">
        ${props.message ?? copy.specify_alias}
      </p>
    </hgroup>
    <form
      id="registerForm"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        e.stopPropagation();
        withRef(aliasInput, (alias) => props.continue(alias.value));
      }}
    >
      <input
        id="pickAliasInput"
        ${ref(aliasInput)}
        @input=${(e: InputEvent) => {
          if (!(e.currentTarget instanceof HTMLInputElement)) {
            return;
          }
          e.currentTarget.setCustomValidity("");
          e.currentTarget.reportValidity();
        }}
        @invalid=${(e: InputEvent) => {
          if (!(e.currentTarget instanceof HTMLInputElement)) {
            return;
          }
          const message = validateAlias(
            e.currentTarget.validity,
            e.currentTarget.value
          );
          e.currentTarget.setCustomValidity(message);
        }}
        placeholder=${copy.placeholder}
        aria-label="device name"
        value=${ifDefined(props.defaultAlias satisfies string | undefined)}
        type="text"
        required
        maxlength="30"
        pattern="^[A-Za-z0-9]+((-|\\s|_)*[A-Za-z0-9])*$"
        spellcheck="false"
        class="c-input"
      />
      <div class="c-button-group">
        <button
          id="pickAliasCancel"
          type="button"
          class="c-button c-button--secondary"
          @click="${() => props.cancel()}"
        >
          ${props.cancelText ?? copy.cancel}
        </button>
        <button id="pickAliasSubmit" type="submit" class="c-button">
          ${copy.next}
        </button>
      </div>
    </form>
  `;

  return mainWindow({
    showFooter: false,
    slot: promptDeviceAliasSlot,
  });
};

export const promptDeviceAliasPage = renderPage(promptDeviceAliasTemplate);

export const inferAlias = (deviceInfo: UAParser): string | undefined => {
  const engineName = deviceInfo.getEngine().name;
  if (engineName === "WebKit") {
    return "Apple Passkey";
  }

  const browser = deviceInfo.getBrowser().name;
  if (nonNullish(browser)) {
    const os = deviceInfo.getOS().name;
    if (nonNullish(os)) {
      return `${browser} on ${os}`;
    }

    return browser;
  }

  return undefined;
};

export const promptDeviceAlias = ({
  title,
  message,
  cancelText,
}: {
  title: string;
  message?: string | TemplateResult;
  cancelText?: string;
}): Promise<string | null> =>
  new Promise((resolve) => {
    const defaultAlias = inferAlias(new UAParser(navigator.userAgent));
    const i18n = new I18n();
    promptDeviceAliasPage({
      title,
      message,
      cancelText,
      cancel: () => resolve(null),
      continue: resolve,
      i18n,
      defaultAlias,
    });
  });
