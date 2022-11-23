import { html, render, TemplateResult } from "lit-html";

type DeviceType = "platform" | "cross-platform" | undefined;

type Props = Parameters<typeof pickDeviceTypeTemplate>[0];

export const pickDeviceTypeTemplate = (props: {
  touchId: () => void;
  yubikey: () => void;
  advanced: () => void;
}): TemplateResult => html`
  <div class="l-container c-card c-card--highlight t-centered">
    <button @click=${() => props.touchId()} class="c-button">TouchID</button>
    <button @click=${() => props.yubikey()} class="c-button">YubiKey</button>
    <button @click=${() => props.advanced()} class="c-button">Advanced</button>
  </div>
`;

export const pickDeviceTypePage = (props: Props): void => {
  const container = document.getElementById("pageContent") as HTMLElement;
  render(pickDeviceTypeTemplate(props), container);
};

export const pickDeviceType = (): Promise<DeviceType> =>
  new Promise((resolve) => {
    pickDeviceTypePage({
      touchId: () => resolve("platform"),
      yubikey: () => resolve("cross-platform"),
      advanced: () => resolve(undefined),
    });
  });
