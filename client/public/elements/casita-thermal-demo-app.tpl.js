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
  `;

  return [elementStyles];
}

export function render() { 
return html`

<div style="display:flex; flex-wrap: wrap;">

  <select @change="${this._onSelectChange}">
    ${this.times.map((item, index) => html`
      <option value="${index}">${item.date}</option>
    `)}
  </select>

  <div>
    ${this.selected.labels.map((item, index) => html`
      <button value="${index}"  @click="${this._onButtonClicked}">${item}</button>
    `)}
  </div>

  <div>Classify</div>
  <input type="number" placeholder="Classify" value="3" @change="${this._onClassifyChange}"/>

  <div>Scale</div>
  <input type="number" placeholder="Scale" value="2" @change="${this._onScaleChange}"/>


</div>

<div style="display:flex; flex-wrap: wrap;">
  <div>
    <div>Average</div>
    <div class="grouped">
      <block-image-product
        product="${this.product}"
        x="${this.x}"
        y="${this.y}"
        date="${this.date}"
        scale="${this.scale}"
        type="average">
      </block-image-product>
      <block-image-product
        @image-mouse-move="${this._onImageMouseMove}"
        product="${this.product}"
        x="${this.x}"
        y="${this.y}"
        date="${this.date}"
        scale="${this.scale}"
        type="classified"
        classify="${this.classify}">
      </block-image-product>
    </div>
  </div>

  <div>
    <div>Raw</div>
    <div class="grouped">
      <block-image-product
        product="${this.product}"
        x="${this.x}"
        y="${this.y}"
        date="${this.date}"
        scale="${this.scale}"
        type="raw">
      </block-image-product>
      <block-image-product
        @image-mouse-move="${this._onImageMouseMove}"
        product="${this.product}"
        x="${this.x}"
        y="${this.y}"
        date="${this.date}"
        scale="${this.scale}"
        type="classified"
        classify="${this.classify}">
      </block-image-product>
    </div>
  </div>

  <div>
    <div>Min</div>
    <block-image-product
      @image-mouse-move="${this._onImageMouseMove}"
      product="${this.product}"
      x="${this.x}"
      y="${this.y}"
      date="${this.date}"
      scale="${this.scale}"
      type="min">
    </block-image-product>
  </div>

  <div>
    <div>Max</div>
    <block-image-product
      @image-mouse-move="${this._onImageMouseMove}"
      product="${this.product}"
      x="${this.x}"
      y="${this.y}"
      date="${this.date}"
      scale="${this.scale}"
      type="max">
    </block-image-product>
  </div>
</div>


<div id="info"></div>
`;}