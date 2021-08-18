import { LitElement } from 'lit';
import {render, styles} from "./leaflet-map.tpl.js";
import "leaflet";

export default class LeafletMap extends LitElement {

  static get properties() {
    return {
      type : {type: String} 
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.images = [];
  }

  firstUpdated() {
    this.loadCount = 0;
    this.initMap();
  }

  async loadImages(images, classify, appElement) {
    this.shadowRoot.querySelector('#loading').style.display = 'block';

    this.images.forEach(image => {
      document.body.removeChild(image.element);
      this.map.removeLayer(image.layer);
    });
    this.images = [];

    images.forEach(image => image.type = this.type);
    
    if( this.type === 'raw' || this.type === 'average' ) {
      let classified = [];
      images.forEach(image => {
        classified.push(Object.assign({}, image, {type: 'classified', classify}))
      });
      images = [...images, ...classified];
    }

    // set bounds if type changes
    if( this.lastProduct !== images[0].product ) {
      this.lastProduct = images[0].product;
      if( this.lastProduct === 'conus') {
        this.map.fitBounds([
          {lat: -200.301361083984375, lng: 2150.2666015625},
          {lat: -748.6986389160156, lng: 1650.2666015625}
        ]);
      } else {
        this.map.fitBounds([
          {lat: -588, lng: 3639},
          {lat: -1088, lng: 3139}
        ]);
      }
    }

    await Promise.all(
      images.map(image => this.addImage(image, appElement))
    );

    this.shadowRoot.querySelector('#loading').style.display = 'none';
  }

  initMap() {
    this.map = L.map(this.shadowRoot.querySelector('#map'), {
      crs: L.CRS.Simple
    });
  }

  setClassify(value) {
    this.classifyUpdate = {
      loadCount : this.loadCount,
      total : 0
    }

    this.images.forEach(image => {
      if( image.element.type !== 'classified' ) return;
      image.element.classify = value;
      this.classifyUpdate.total++;
    });

    if( this.classifyUpdate.total > 0 ) {
      this.shadowRoot.querySelector('#loading').style.display = 'block';
    }
  }

  addImage(data, appElement) {
    return new Promise((resolve, reject) => {
      let element = document.createElement('block-image-product');
      element.style.display = 'none';
      document.body.appendChild(element);
  
      element.addEventListener('loading', e => {
        if( !e.detail.loaded ) return;
        if( !this.isConnected ) return; // remove from DOM already, ignore;

        // see if this element already has an image
        let image = this.images.find(image => image.element === element);
        if( image ) this.map.removeLayer(image.layer);

        var bounds = [[-1*element.y, element.x], [-1*(element.y+element.height), element.x+element.width]];
        var layer = L.imageOverlay(
          element.getDataUrl(), 
          bounds,
          {
            zIndex : data.type === 'classified' ? 2 : 1
          })
          .addTo(this.map);

        this.loadCount++;

        if( this.classifyUpdate && 
            this.classifyUpdate.loadCount + this.classifyUpdate.total === this.loadCount ) {
          this.shadowRoot.querySelector('#loading').style.display = 'none';
          this.classifyUpdate = null;
        }

        if( image ) {
          image.layer = layer;
          return;
        }

        this.images.push({element, layer});
        resolve();
      });

      element.setData(data, appElement);
    });
  }

}

customElements.define('leaflet-map', LeafletMap);