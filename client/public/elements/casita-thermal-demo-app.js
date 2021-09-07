import { LitElement } from 'lit';
import {render, styles} from "./casita-thermal-demo-app.tpl.js";
import {PNG} from "@ucd-lib/pngjs";


import "./block-image-product"
import "./leaflet-map"
import "./event-chart"

export default class CasitaThermalDemoApp extends LitElement {

  static get properties() {
    return {
      times : {type: Array},
      ratio : {type: Number},
      selected : {type: Object},

      scale : {type: Number},
      selectedIndex : {type: Number},

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
    this.classify = 4;
    this.scale = 2;
    this.selectedIndex = -1;
  
    window.addEventListener('hashchange', () => this._onHashChange())
  }

  _onHashChange() {
    let id =  window.location.hash.replace(/#/, '');
    if( !id ) return;

    let index = this.times.findIndex(item => item.date === id);
    if( index === -1 ) return;

    this.selectedIndex = index;
    let item = this.times[index];
    this.selected = item;
    

    // this.stdDevPromise = this.getStddev({
    //   product : item.images[0].product,
    //   date : item.images[0].date,
    //   x : item.images[0].x,
    //   y : item.images[0].y,
    // });

    this.maps.forEach(map => map.loadImages(item.images, this.classify, this));
  }

  async loadImages() {
    let resp = await fetch(this.host+'products');
    let data = await resp.json();

    let times = {};

    function getLabel(item) {
      return item.product+'-'+item.x+'-'+item.y;
    }

    let zone = new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
    data.forEach(item => {
      if( !times[item.date] ) {
        times[item.date] = {
          label : item.blocks_ring_buffer_id+' - '+ new Date(item.date).toLocaleString()+` ${zone} - `+item.product,
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
    this._onHashChange();
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

      this.loadImages();
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

            data.x = ix+1;
            data.y = iy+1;

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
    let id = parseInt(e.currentTarget.value);
    let item = this.times[id];
    window.location.hash = item.date;
  }

  _onClassifyChange(e) {
    this.classify = parseInt(e.currentTarget.value);
    this.maps.forEach(map => map.setClassify(this.classify));
  }

  async _onMapClick(e) {
    let y = Math.floor(e.latlng.lat * -1);
    let x = Math.floor(e.latlng.lng);

    let ix = -1, iy = -1;
    let selectedImage, value, average;

    for( let element of this.maps ) {
      for( let image of element.images ) {
        image = image.element;
        if( image.x <= x && image.x + image.width >= x ) {
          if( image.y <= y && image.y + image.height >= y ) {
            // debugger;
            ix = x - image.x;
            iy = y - image.y;

            if( image.type === 'raw') {
              selectedImage = image;
              value = image.pngImage.data[(ix + (iy * image.width)) * 4];
              break;
            } else if( image.type === 'amax-average') {
              average = image.pngImage.data[(ix + (iy * image.width)) * 4]
            }

          }
        }
      }
    }

    this._renderMaxValues(selectedImage, ix+1, iy+1, value);
    // this._renderAll(image, ix, iy, value, average, rawImage);
  }

  async _renderAllOld(image, ix, iy, value, average) {
    this.shadowRoot.querySelector('#chart').style.display = 'none';
    this.shadowRoot.querySelector('#chartLoading').style.display = 'block';

    let date = new Date(this.selected.date);

    let resp = await fetch(this.host+`px-values/${image.product}/${image.x}/${image.y}/max/${ix+1}/${iy+1}`);
    let json = await resp.json();

    let mode = this.getPixelMode(json)+5;
    let rollingAverage = [];
    let rollingAverageMax = 10;

    json = json.map((item, index) => {
      if( item.value === 8191 ) item.value = json[index-1].value

      rollingAverage.push(item.value);
      if( rollingAverage.length > rollingAverageMax ) rollingAverage.shift();
      let ra = rollingAverage.reduce((v, current) => current + v) / rollingAverage.length;

      let d = new Date(item.date);
      return [(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes(), item.value, average, mode, ra]
    });

    rollingAverage.push(value);
    if( rollingAverage.length > rollingAverageMax ) rollingAverage.shift();
    let ra = rollingAverage.reduce((v, current) => current + v) / rollingAverage.length;


    json.push([(date.getMonth()+1)+'/'+date.getDate()+' '+date.getHours()+':'+date.getMinutes(), value, average, mode, ra])
    json.unshift(['Date', 'Value', 'Average', 'Mode', 'Rolling Average']);

    console.log(json);
    var data = google.visualization.arrayToDataTable(json);

    var options = {
      title: `Data Used For Average - (${image.x}, ${image.y}, ${image.product}) - (${ix}, ${iy})`,
      legend: { position: 'bottom' }
    };

    if( !this.chart ) {
      this.chart = new google.visualization.LineChart(this.shadowRoot.querySelector('#chart'));
    }

    this.shadowRoot.querySelector('#chart').style.display = 'block';
    this.shadowRoot.querySelector('#chartLoading').style.display = 'none';    

    this.chartData = {data, options};
    this.chart.draw(data, options);
  }

  async _renderMaxValues(image, ix, iy, value) {
    this.shadowRoot.querySelector('#chart').style.display = 'none';
    this.shadowRoot.querySelector('#chartLoading').style.display = 'block';

    let date = new Date(this.selected.date);

    let resp = await fetch(this.host+`px-values/${image.product}/${image.x}/${image.y}/max/${ix+1}/${iy+1}`);
    let max = await resp.json();

    resp = await fetch(this.host+`px-values/${image.product}/${image.x}/${image.y}/amax-average/${ix+1}/${iy+1}`);
    let average = {};
    (await resp.json()).forEach(item => average[item.date] = item);

    resp = await fetch(this.host+`px-values/${image.product}/${image.x}/${image.y}/amax-stddev/${ix+1}/${iy+1}`);
    let stddev = {};
    (await resp.json()).forEach(item => stddev[item.date] = item);
    

    let json = max.map((item, index) => {
      if( item.value === 8191 ) item.value = max[index-1].value

      let d = new Date(item.date);
      let avg = (average[item.date] || {}).value || 0;
      let sd = Math.max(100, Math.min(500, (stddev[item.date] || {}).value || 0));
      return [
        (d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes(), 
        value,
        item.value, 
        avg,
        sd,
        avg+(sd*4)
      ]
    });

    json.unshift(['Date', 'current value', 'max', 'amax-average', 'amax-stddev', 'avg+(stddev*4)']);

    // console.log(json);
    var data = google.visualization.arrayToDataTable(json);

    var options = {
      title: `${image.product}, ${image.x}, ${image.y} - (${ix}, ${iy})`,
      legend: { position: 'bottom' }
    };

    if( !this.chart ) {
      this.chart = new google.visualization.LineChart(this.shadowRoot.querySelector('#chart'));
    }

    this.shadowRoot.querySelector('#chart').style.display = 'block';
    this.shadowRoot.querySelector('#chartLoading').style.display = 'none';    

    this.chartData = {data, options};
    this.chart.draw(data, options);
  }

  async _renderAll(id, ix, iy, value, average, rawImage) {
    this.shadowRoot.querySelector('#chartAll').style.display = 'none';
    this.shadowRoot.querySelector('#chartAllLoading').style.display = 'block';

    let date = new Date(this.selected.date);
    let after = new Date(test.getTime() + 1000 * 60 * 60 * 2);
    let before = new Date(test.getTime() - 1000 * 60 * 60 * 2);

    let resp = await fetch(this.host+`px-values/${id}/${ix+1}/${iy+1}?all=true`);
    let json = await resp.json();

    let mode = this.getPixelMode(json)+5;



    json = json.map(item => {
      let d = new Date(item.date);
      return [(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes(), item.value, average, mode]
    });

    json.push([(date.getMonth()+1)+'/'+date.getDate()+' '+date.getHours()+':'+date.getMinutes(), value, average, mode])
    json.unshift(['Date', 'Value', 'Average', 'Mode']);

    var data = google.visualization.arrayToDataTable(json);

    var options = {
      title: `All Data - (${rawImage.x}, ${rawImage.y}, ${rawImage.product}) - (${ix}, ${iy})`,
      legend: { position: 'bottom' }
    };

    if( !this.chartAll ) {
      this.chartAll = new google.visualization.LineChart(this.shadowRoot.querySelector('#chartAll'));
    }

    this.shadowRoot.querySelector('#chartAll').style.display = 'block';
    this.shadowRoot.querySelector('#chartAllLoading').style.display = 'none';    

    this.chartAllData = {data, options};
    this.chartAll.draw(data, options);
  }

  getPixelMode(rows, groupByFactor=10) {
    let grouped = {}, v;
    let sum = 0;
    for( let row of rows ) {
      v = Math.floor(row.value / groupByFactor);
      if( !grouped[v] ) grouped[v] = {value: v, count: 0};
      grouped[v].count++;
      sum += row.value;
    }

    grouped = Object.values(grouped);
    grouped.sort((a, b) => a.count - b.count < 0 ? 1 : -1);
    let mode = grouped[0].value * groupByFactor;
    return mode;
  }

  async getStddev(opts) {
    let resp = await fetch(
      this.host+'png/'+
      [opts.product, opts.x, opts.y, opts.date, 'stddev'].join('/')
    );
    let rawImageData = await resp.arrayBuffer();
    this.stdDevPngImage = await this.createPng(rawImageData);
  }

  createPng(imageData) {
    return new Promise((resolve, reject) => {
      let png = new PNG({ 
        colorType: 0, 
        inputColorType: 0, 
        bitDepth: 16,
        inputHasAlpha: false, 
        skipRescale: true
      })
      png.parse(imageData, function (error, img) {
        if( error ) reject(error);
        else resolve(img);
      });
    });
  }


}

customElements.define('casita-thermal-demo-app', CasitaThermalDemoApp);