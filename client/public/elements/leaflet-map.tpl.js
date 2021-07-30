import { html, css } from 'lit';
import leafletCss from "leaflet/dist/leaflet.css"

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
      position: relative;
    }
    #map {
      height: 500px;
      width: 500px;
    }
    #loading {
      position: absolute;
      display: none;
      color: orange;
      bottom: 0;
      right: 0;
      font-weight: bold;
      z-index: 1000;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
<style>
    ${leafletCss}
</style>

<div id="map"></div>
<div id="loading">Loading...</div>
`;}