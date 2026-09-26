import TOKENS from '../../ui/tokens.css?inline'

export const BUTTON_SIZE = 26

export const STYLES = `${TOKENS}
  :host { all: initial; }
  .container {
    position: fixed; z-index: var(--lf-z-page-overlay);
    font: var(--lf-text-callout)/1.4 var(--lf-font);
    -webkit-font-smoothing: antialiased;
    color: var(--lf-label);
  }
  button { font: inherit; color: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--lf-focus); outline-offset: 2px; }
  .trigger {
    display: grid; place-items: center; width: ${BUTTON_SIZE}px; height: ${BUTTON_SIZE}px; padding: 0;
    border: 0; border-radius: 7px; background: none;
    box-shadow: var(--lf-shadow-float);
    animation: pop var(--lf-duration-fast) var(--lf-ease);
  }
  .trigger svg { display: block; width: ${BUTTON_SIZE}px; height: ${BUTTON_SIZE}px; border-radius: 7px; }
  /* macOS menu material: translucent and blurred, so it reads as floating above the page. */
  .menu {
    position: absolute; inset-inline-start: 0; top: ${BUTTON_SIZE + 6}px;
    min-width: 232px; max-width: min(340px, calc(100vw - 16px)); padding: 5px;
    border-radius: var(--lf-radius-lg); background: var(--lf-material);
    -webkit-backdrop-filter: var(--lf-material-filter); backdrop-filter: var(--lf-material-filter);
    box-shadow: var(--lf-shadow-float);
    animation: pop var(--lf-duration-fast) var(--lf-ease);
  }
  .menu.above { top: auto; bottom: ${BUTTON_SIZE + 6}px; }
  .menu.end { inset-inline-start: auto; inset-inline-end: 0; }
  .title { padding: 5px 9px 4px; color: var(--lf-label-on-material); font-size: var(--lf-text-footnote); font-weight: var(--lf-weight-semibold); }
  .item {
    display: grid; grid-template-columns: auto 1fr; gap: 0 10px; align-items: center; width: 100%;
    padding: 6px 9px; border: 0; border-radius: var(--lf-radius-sm); background: none; text-align: start;
  }
  /* macOS menu highlight: the whole row turns accent with white labels. */
  .item:hover, .item:focus-visible { background: var(--lf-accent); color: var(--lf-label-on-accent); outline: none; }
  .chip {
    grid-row: span 2; display: grid; place-items: center; min-width: 28px; height: 28px; padding: 0 5px;
    border-radius: 7px; background: var(--lf-accent); color: var(--lf-label-on-accent);
    font-size: var(--lf-text-callout); font-weight: var(--lf-weight-bold);
  }
  .item:hover .chip, .item:focus-visible .chip { background: var(--lf-label-on-accent); color: var(--lf-accent); }
  .name { font-weight: var(--lf-weight-semibold); }
  .preview { color: var(--lf-label-on-material); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item:hover .preview, .item:focus-visible .preview { color: inherit; }
  .settings {
    position: relative; display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 9px; padding: 6px 9px;
    border: 0; border-radius: var(--lf-radius-sm); background: none; text-align: start;
  }
  .settings::before { content: ''; position: absolute; inset-block-start: -5px; inset-inline: 9px; border-top: 1px solid var(--lf-separator); }
  .settings:hover, .settings:focus-visible { background: var(--lf-accent); color: var(--lf-label-on-accent); outline: none; }
  .settings svg { flex: none; }
  @media (pointer: coarse) {
    .item { padding: 11px 10px; }
    .settings { padding: 12px 10px; }
  }
  @keyframes pop { from { opacity: 0; transform: scale(0.94); } }
`

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"'

/**
 * The extension mark drawn inline; page-side images would need web_accessible_resources.
 * `style` fills (not attributes) so the shadow root's tokens apply.
 */
export const ICON_SVG = `
<svg ${SVG_NS} viewBox="0 0 26 26" aria-hidden="true">
  <rect width="26" height="26" rx="7" style="fill: var(--lf-accent)"/>
  <text x="13" y="18.5" fill="white" font-size="15" font-weight="600" text-anchor="middle"
    font-family="'SF Arabic', 'Geeza Pro', 'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif">ع</text>
</svg>`

export const SETTINGS_SVG = `
<svg ${SVG_NS} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
  <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6"/><circle cx="10" cy="4.5" r="1.5"/><circle cx="6" cy="11.5" r="1.5"/>
</svg>`
