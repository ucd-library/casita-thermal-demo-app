import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: inline-block;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`

<canvas @mousemove="${this._onMouseMove}"></canvas>

`;}