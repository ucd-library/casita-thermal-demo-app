import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
    #chart {
      height: 600px;
      width: 1200px;
    }
    .layout {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 25px;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`

<div class="layout">
  <div>
    <div>Event Id: ${this.pixel.thermal_event_id}</div>
    <div>Pixel Id: ${this.pixel.thermal_event_px_id}</div>
    <div>Pixel Date: ${this.pixel.date}</div>
    <div>Pixel Product: ${this.pixel.product} (${this.pixel.apid})</div>
    <div>Pixel Band: ${this.pixel.band}</div>
    <div>Product Block (x,y): ${this.pixel.block_x}, ${this.pixel.block_y}</div>
    <div>Product Block Offset (x,y): ${this.pixel.pixel_x}, ${this.pixel.pixel_y}</div>
    <div>Pixel Fulldisk Offset (x,y): ${this.pixel.world_x}, ${this.pixel.world_y}</div>
  </div>
</div>

<div id="chartLoading" style="display:none">Loading values used in average...</div>
<div id="chart" style="display:none"></div>

`;}