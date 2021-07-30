import { LitElement } from 'lit';
import {render, styles} from "./block-image-product.tpl.js";
import {PNG} from "@ucd-lib/pngjs";


export default class BlockImageProduct extends LitElement {

  static get properties() {
    return {
      x : {type: Number},
      y : {type: Number},
      product : {type: String},
      date : {type: String},
      type : {type: String},
      classify : {type: Number},
      host : {type: String},
      scale : {type: String}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.host = APP_CONFIG.dataServer.url+APP_CONFIG.dataServer.thermalApiPath+'/png/';
    this.classify = '';
    this.scale = 2;
  }

  firstUpdated() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  updated(props) {
    if( props.has('x') || props.has('y') || props.has('product') || 
        props.has('date') || props.has('type') || props.has('classify') ) {
        
      if( !this.product ) return;
      this.renderImg();
    }

    if( props.has('scale') && this.scale ) {
      this.rescale();
    }

  }

  rescale() {
    if( !this.pngImage ) return;

    this.style.width = (this.pngImage.width*this.scale)+'px';
    this.style.height = (this.pngImage.height*this.scale)+'px';
    this.canvas.style.transform = `scale(${this.scale}, ${this.scale})`;
    this.canvas.style.transformOrigin = 'top left'
  }

  async renderImg() {
    let classifyRatio = (this.classify && this.type === 'classified') ? '?ratio='+this.classify : '';
    let resp = await fetch(
        this.host+
        [this.product, this.x, this.y, this.date, this.type].join('/')+
        classifyRatio
    );
    this.rawImageData = await resp.arrayBuffer();
    this.pngImage = await this.createPng(this.rawImageData);

    this.canvas.setAttribute('width', this.pngImage.width);
    this.canvas.setAttribute('height', this.pngImage.height);
    let canvasImageData = this.ctx.getImageData(0, 0, this.pngImage.width, this.pngImage.height);

    if( this.type === "classified" ) {
      this.drawC(this.pngImage, canvasImageData);
    } else {
      this.drawBW(this.pngImage, canvasImageData);
    }

    this.ctx.putImageData(canvasImageData, 0, 0);

    this.rescale();
  }

  drawC(pngImage, canvasImageData) {
    for( let i = 0; i < pngImage.data.length; i += 4 ) {
      canvasImageData.data[i] = pngImage.data[i] >= 1 ? 255 : 0;
      canvasImageData.data[i+1] = 0;
      canvasImageData.data[i+2] = 0;
      canvasImageData.data[i+3] = pngImage.data[i] >= 1 ? 255 : 0;
    }
  }

  drawBW(pngImage, canvasImageData) {
    let min =  65536;
    let max = 0;
    for( let i = 0; i < pngImage.data.length; i += 4 ) {
      if( pngImage.data[i] < min ) min = pngImage.data[i];
      if( pngImage.data[i] > max ) max = pngImage.data[i];
    }
    let ratio = (max-min) / 256;


    let val;
    for( let i = 0; i < pngImage.data.length; i += 4 ) {
      val = Math.floor((pngImage.data[i] - min) / ratio);
      canvasImageData.data[i] = val;
      canvasImageData.data[i+1] = val;
      canvasImageData.data[i+2] = val;
      canvasImageData.data[i+3] = 255;
    }
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

  _onMouseMove(e) {
    if( !this.pngImage ) return;

    let rect = this.getBoundingClientRect();

    let x = Math.floor((e.pageX - rect.left) / this.scale);
    let y = Math.floor((e.pageY - rect.top) / this.scale);
    this.dispatchEvent(new CustomEvent(
      'image-mouse-move', {
        detail: {x, y}}
    ));
  }

}

customElements.define('block-image-product', BlockImageProduct);