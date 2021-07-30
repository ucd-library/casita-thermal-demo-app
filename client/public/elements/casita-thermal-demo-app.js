import { LitElement } from 'lit';
import {render, styles} from "./casita-thermal-demo-app.tpl.js";
import {PNG} from "@ucd-lib/pngjs";


import "./block-image-product"
import "./leaflet-map"

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
          label : item.date.replace(/T/, ' ').replace(/\..*/, '')+' - '+item.product,
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

    setTimeout(() => {
      this.maps = this.shadowRoot.querySelectorAll('leaflet-map');
      this.maps.forEach(ele => {
        ele.map.addEventListener('zoomend', e => this._onMoveEnd(ele.map, ele.map.getBounds()))
        ele.map.addEventListener('moveend', e => this._onMoveEnd(ele.map, ele.map.getBounds()))
        ele.map.addEventListener('mousemove', e => this._onMapMouseMove(e));
        ele.map.addEventListener('click', e => this._onMapClick(e));
      });
    }, 500);
  }

  _onMapMouseMove(e) {
    let y = Math.floor(e.latlng.lat * -1);
    let x = Math.floor(e.latlng.lng);

    let data = {}, ix, iy;

    for( let element of this.maps ) {
      for( let image of element.images ) {
        image = image.element;
        if( image.x <= x && image.x + image.width >= x ) {
          if( image.y <= y && image.y + image.height >= y ) {
            // debugger;
            ix = x - image.x;
            iy = y - image.y;

            data.x = ix;
            data.y = iy;

            data[image.type] = image.pngImage.data[(ix + (iy * image.width)) * 4]
          }
        }
      }
    }

    let html = '';
    for( let key in data ) {
      html += `<div>${key}: ${data[key]}</div>`;
    }

    this.info.innerHTML = html;
  }

  _onMoveEnd(eventMap, bounds) {
    if( this.moveListenDelay === true ) return;
    this.moveListenDelay = true;
    setTimeout(() => {
      this.moveListenDelay = false;
    }, 100);

    this.maps.forEach(ele => {
      if( ele.map === eventMap ) return;
      ele.map.fitBounds(bounds);
    });
  }

  _onSelectChange(e) {
    if( !e.currentTarget.value ) return;
    let item = this.times[parseInt(e.currentTarget.value)];
    this.selected = item;
    this.maps.forEach(map => map.loadImages(item.images, this.classify));
  }

  _onClassifyChange(e) {
    this.classify = parseInt(e.currentTarget.value);
    this.maps.forEach(map => map.setClassify(this.classify));
  }

  async _onMapClick(e) {
    this.shadowRoot.querySelector('#chart').style.display = 'none';

    let y = Math.floor(e.latlng.lat * -1);
    let x = Math.floor(e.latlng.lng);

    let ix = -1, iy = -1;
    let id;

    for( let element of this.maps ) {
      for( let image of element.images ) {
        image = image.element;
        if( image.x <= x && image.x + image.width >= x ) {
          if( image.y <= y && image.y + image.height >= y ) {
            // debugger;
            ix = x - image.x;
            iy = y - image.y;
            id = image.blocks_ring_buffer_id;
            break;
          }
        }
      }
    }

    let resp = await fetch(this.host+`px-values/${id}/${ix}/${iy}`);
    let json = await resp.json();

    json = json.map(item => [item.date, item.value]);
    json.unshift(['Date', 'Value']);

    var data = google.visualization.arrayToDataTable(json);

    var options = {
      title: 'Thermal (Band 7) Data',
      legend: { position: 'bottom' }
    };

    if( !this.chart ) {
      this.chart = new google.visualization.LineChart(this.shadowRoot.querySelector('#chart'));
    }
    this.shadowRoot.querySelector('#chart').style.display = 'block';
    

    this.chart.draw(data, options);
  }

}

customElements.define('casita-thermal-demo-app', CasitaThermalDemoApp);