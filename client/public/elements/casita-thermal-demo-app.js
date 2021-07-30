import { LitElement } from 'lit';
import {render, styles} from "./casita-thermal-demo-app.tpl.js";
import {PNG} from "@ucd-lib/pngjs";


import "./block-image-product"

export default class CasitaThermalDemoApp extends LitElement {

  static get properties() {
    return {
      times : {type: Array},
      ratio : {type: Number},
      selected : {type: Object},

      scale : {type: Number},

      x : {type: Number},
      y : {type: Number},
      product : {type: String},
      date : {type: String},
      classify : {type: Number},
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.host = APP_CONFIG.dataServer.url+APP_CONFIG.dataServer.thermalApiPath+'/';
    
    this.products = {};
    this.times = [];
    this.ration = [];
    this.selected = {labels:[], images:[]};
    this.classify = 3;
    this.scale = 2;
  
    this.loadImages();
  }

  async loadImages() {
    let resp = await fetch(this.host+'products');
    let data = await resp.json();

    let times = {};

    function getLabel(item) {
      return item.product+'-'+item.x+'-'+item.y;
    }

    data.forEach(item => {
      if( !times[item.date] ) {
        times[item.date] = {
          date : item.date,
          dateObj : new Date(item.date),
          labels : [],
          images : []
        };
      }

      times[item.date].labels.push(getLabel(item));
      times[item.date].images.push(item);
    });

    times = Object.values(times);
    times.sort((a, b) => a.dateObj.getTime() > b.dateObj.getTime() ? -1 : 1);

    this.times = times;
  }

  firstUpdated() {
    this.info = this.shadowRoot.querySelector('#info');
    Array.from(this.shadowRoot.querySelectorAll('block-image-product'))
      .forEach(ele => this.products[ele.getAttribute('type')] = ele);
  }

  _onImageMouseMove(e) {
    let coord = e.detail;
    let data = {};
    let html = "";

    for( let key in this.products ) {
      data[key] = this.products[key].pngImage.data[
        (coord.x + (coord.y * this.products[key].pngImage.width)) * 4
      ];
      html += `<div>${key}: ${data[key]}</div>`;
    }

    this.info.innerHTML = html;
  }

  _onSelectChange(e) {
    let item = this.times[parseInt(e.currentTarget.value)];
    this.selected = item;
  }

  _onButtonClicked(e) {
    let image = this.selected.images[parseInt(e.currentTarget.value)];

    this.product = image.product;
    this.x = image.x;
    this.y = image.y;
    this.date = image.date;
  }

  _onClassifyChange(e) {
    this.classify = parseInt(e.currentTarget.value);
  }

  _onScaleChange(e) {
    this.scale = parseInt(e.currentTarget.value);
  }

}

customElements.define('casita-thermal-demo-app', CasitaThermalDemoApp);