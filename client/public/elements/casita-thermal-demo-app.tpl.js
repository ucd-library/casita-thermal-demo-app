import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }

    .grouped {
      display: inline-block;
      position: relative;
    }
    .grouped > [type="classified"] {
      position: absolute;
      top: 0;
      left: 0;
    }
    #info {
      position: fixed;
      bottom: 0;
      right: 0;
      border: 1px solid black;
      padding: 10px;
      background-color: white;
    }
    #chart {
      height: 600px;
      width: 1200px;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`

<div style="display:flex; flex-wrap: wrap;">

  <select @change="${this._onSelectChange}">
    <option></option>
    ${this.times.map((item, index) => html`
      <option value="${index}">${item.label}</option>
    `)}
  </select>

  <div>Classify</div>
  <input type="number" placeholder="Classify" value="2" @change="${this._onClassifyChange}"/>

</div>

<div style="display:flex; flex-wrap: wrap;">
  <div>
    <div>Average</div>
    <div class="grouped">
      <leaflet-map type="average"></leaflet-map>
    </div>
  </div>

  <div>
    <div>Raw</div>
    <div class="grouped">
      <leaflet-map type="raw"></leaflet-map>
    </div>
  </div>

  <div>
    <div>Min</div>
    <leaflet-map type="min"></leaflet-map>
  </div>

  <div>
    <div>Max</div>
    <leaflet-map type="max"></leaflet-map>
  </div>
</div>

<div id="chart"></div>


<div id="info"></div>
`;}