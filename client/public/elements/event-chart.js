import { LitElement } from 'lit';
import {render, styles} from "./event-chart.tpl.js";

export default class EventChart extends LitElement {

  static get properties() {
    return {
      pixel : {type: Object}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.pixel = {};
    this.render = render.bind(this);
    this.host = APP_CONFIG.dataServer.url+APP_CONFIG.dataServer.thermalApiPath+'/';
  }

  firstUpdated() {
    if( window.GOOGLE_CHARTS_LOADED ) {
      this._renderChart();
    } else {
      window.googleChartsCallback = this._renderChart.bind(this);
    }
  }

  async _renderChart() {
    let eventId = window.location.pathname.replace('/thermal-event-px/', '');

    this.shadowRoot.querySelector('#chart').style.display = 'none';
    this.shadowRoot.querySelector('#chartLoading').style.display = 'block';

    let resp = await fetch(this.host+`thermal-event-px/${eventId}`);
    resp = await resp.json();
    this.pixel = resp.pixel;
    resp.data.forEach(item => item.date = new Date(item.date));

    resp.data.sort((a, b) => a.date.getTime() < b.date.getTime() ? -1 : 1);
    
    let json = resp.data.map((item, index) => {
      let sd = Math.max(100, Math.min(500, item['amax-stddev']));

      return [
        (item.date.getMonth()+1)+'/'+item.date.getDate()+'@'+item.date.getHours(), 
        resp.pixel.value,
        item.max, 
        item['amax-average'],
        sd,
        item['amax-average']+(sd*4)
      ]
    });

    json.unshift(['Date', 'Current Value', 'Hourly Max', '10 Day Max Average', '10 Day Max stddev', 'Threshold: avg+(stddev*4)']);

    // console.log(json);
    var data = google.visualization.arrayToDataTable(json);

    var options = {
      title: `${resp.pixel.product}, ${resp.pixel.block_x}, ${resp.pixel.block_y} - (${resp.pixel.pixel_x}, ${resp.pixel.pixel_y})`,
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

}

customElements.define('event-chart', EventChart);