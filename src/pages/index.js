import center from '@turf/center';
import { featureCollection } from '@turf/helpers';
import { graphql } from 'gatsby';
// import {
//   uniq,
// } from 'lodash';
import React, {Component} from "react"
import { Helmet } from "react-helmet"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';

import RulesContainer from "../components/RulesContainer"

mapboxgl.accessToken = 'pk.eyJ1Ijoic2FhZGlxbSIsImEiOiJjamJpMXcxa3AyMG9zMzNyNmdxNDlneGRvIn0.wjlI8r1S_-xxtq2d-W5qPA';
const COLOR_MAP = {
  'any': 'purple',
  'bike': 'green',
  'car share': 'blue',
  'carpool': 'yellow',
  'commercial': 'orange',
  'compact': 'brown',
  'construction': 'green',
  'electric': 'blue',
  'emergency': 'yellow',
  'food truck': 'orange',
  'handicap': 'brown',
  'micromobility': 'green',
  'motorcycle': 'blue',
  'passenger': 'yellow',
  'permit': 'orange',
  'police': 'blue',
  'rideshare': 'brown',
  'staff': 'green',
  'student': 'blue',
  'taxi': 'yellow',
  'truck': 'brown',
  'visitor': 'orange',
}
class CurbMap extends Component {

  constructor(props) {
    super(props);
    this.state = {
      TimeValue:'10:00',
      DayValue:1,
      SelectedView:"Parking Class"
    };
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleDayChange = this.handleDayChange.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
  }

  componentDidMount() {
    const fc = featureCollection(this.props.data.dataJson.features);
    const centerPoint = center(fc).geometry.coordinates;

    const parkingFc = featureCollection([]);
    parkingFc.features = [];
    this.props.data.dataJson.features.forEach((feature) => {
      feature.properties.regulations.forEach((reg) => {
        if (reg.rule && reg.rule.activity === "parking") {
          // parking
          if (reg.userClasses && reg.userClasses.length > 0) {
            reg.userClasses.forEach((currClass) => {
              const outputFeature = Object.assign({}, feature);
              outputFeature.properties.parking = true;
              outputFeature.properties.class = currClass.class;
              outputFeature.properties.color = COLOR_MAP[currClass.class];
              // console.log("parking=>class", currClass);
              parkingFc.features.push(outputFeature);
            });
          } else {
            const outputFeature = Object.assign({}, feature);
            outputFeature.properties.parking = true;
            outputFeature.properties.class = '';
            outputFeature.properties.color = COLOR_MAP['any'];
            // console.log("parking=>no class");
            parkingFc.features.push(outputFeature);  
          }
        } else if (reg.rule && reg.rule.activity === "no parking") {
          // no parking
          if (reg.userClass && reg.userClass.classes) {
            reg.userClass.classes.forEach((currClass) => {
              const outputFeature = Object.assign({}, feature);
              outputFeature.properties.parking = false;
              outputFeature.properties.class = currClass;
              outputFeature.properties.color = 'red';
              // console.log("no parking=>class", currClass);
              parkingFc.features.push(outputFeature);
            });
          } else {
            const outputFeature = Object.assign({}, feature);
            outputFeature.properties.parking = false;
            outputFeature.properties.class = '';
            outputFeature.properties.color = 'red';
            // console.log("no parking=>no class");
            parkingFc.features.push(outputFeature);  
          }
        }
      });
    });
    console.log("parkingFc", parkingFc);


    const loadingFc = featureCollection([]);
    loadingFc.features = [];
    this.props.data.dataJson.features.forEach((feature) => {
      feature.properties.regulations.forEach((reg) => {
        if (reg.rule && reg.rule.activity === "loading" || reg.rule && reg.rule.activity === "standing") {
          // loading
          if (reg.userClass && reg.userClass.classes) {
            reg.userClass.classes.forEach((currClass) => {
              const outputFeature = Object.assign({}, feature);
              outputFeature.properties.loading = true;
              outputFeature.properties.class = currClass;
              outputFeature.properties.color = COLOR_MAP[currClass];
              // console.log("loading=>class", currClass);
              loadingFc.features.push(outputFeature);
            });
          } else {
            const outputFeature = Object.assign({}, feature);
            outputFeature.properties.loading = true;
            outputFeature.properties.class = '';
            outputFeature.properties.color = COLOR_MAP['any'];
            // console.log("loading=>no class");
            loadingFc.features.push(outputFeature);  
          }
        } else if (reg.rule && reg.rule.activity === "no loading" || reg.rule && reg.rule.activity === "no standing") {
          // no loading
          if (reg.userClass && reg.userClass.classes) {
            reg.userClass.classes.forEach((currClass) => {
              const outputFeature = Object.assign({}, feature);
              outputFeature.properties.loading = false;
              outputFeature.properties.class = currClass;
              outputFeature.properties.color = 'red';
              // console.log("no loading=>class", currClass);
              loadingFc.features.push(outputFeature);
            });
          } else {
            const outputFeature = Object.assign({}, feature);
            outputFeature.properties.loading = false;
            outputFeature.properties.class = '';
            outputFeature.properties.color = 'red';
            // console.log("no loading=>no class");
            loadingFc.features.push(outputFeature);  
          }
        }
      });
    });
    console.log("loadingFc", loadingFc);
    
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/saadiqm/cjxbd493m05cc1cl29jntlb1w',
      // center: [-118.3356366, 34.0495963],
      center: centerPoint,
      zoom: 15
    });

    let scaledWidth = (width) => {return {
        "type": "exponential",
        "base": 2,
        "stops": [
            [10, width * Math.pow(2, (10 - 16))],
            [16, width * Math.pow(2, (16 - 16))]
        ]
    }};

    this.map.on('load', () => {
      this.map.addSource('Parking Curbs', {
        type: 'geojson',
        data: parkingFc
      });

      this.map.addLayer({
          "id": "Parking Class Right",
          "type": "line",
          "source": "Parking Curbs",
          "layout":{
            "visibility":'none'
          },
          "paint": {
            // "line-color": 'red',
            "line-color": ['get', 'color'],
            // "line-color": ['match', ['get', 'class',['get','who',['get','restrictions']]],
            //          'Passenger Vehicle', '#4286f4',
            //          'Taxi', 'red',
            //          'Loading','yellow',
            //          'Calgary Transit Access','orange',
            //          'yellow'] ,
            "line-width": scaledWidth(12),
            "line-offset": scaledWidth(15),
            "line-opacity": 0.7
          },
          filter:[
            "all",
              ["match",['get', 'sideOfStreet', ['get',"location"]],"right",true,false],
              // ["match",['get','activity',['get','rule',['get','regulations']]],"parking", true,false]
          ]
        });

      this.map.addLayer({
        "id": "Parking Class Left",
        "type": "line",
        "source": "Parking Curbs",
        "layout":{
          "visibility":"none"
        },
        "paint": {
          // "line-color": 'blue',
          "line-color": ['get', 'color'],
          // "line-color": ['match', ['get', 'class',['get','who',['get','restrictions']]],
          //          'Passenger Vehicle', '#4286f4',
          //          'Taxi', 'red',
          //          'Loading','green',
          //          'Calgary Transit Access','orange',
          //          'yellow'],
          "line-width": scaledWidth(12),
          "line-offset": scaledWidth(-15),
          "line-opacity": 0.7
        },
        filter:[
          "all",
            ["match",['get', 'sideOfStreet', ['get',"location"]],"left",true,false],
            // ["match",['get','activity',['get','rule',['get','regulations']]],"parking", true,false]
        ]
      });

      this.map.addSource('Loading Curbs', {
        type: 'geojson',
        data: loadingFc
      });

      this.map.addLayer({
          "id": "Loading Class Right",
          "type": "line",
          "source": "Loading Curbs",
          "layout":{
            "visibility":'none'
          },
          "paint": {
            // "line-color": 'red',
            "line-color": ['get', 'color'],
            // "line-color": ['match', ['get', 'class',['get','who',['get','restrictions']]],
            //          'Passenger Vehicle', '#4286f4',
            //          'Taxi', 'red',
            //          'Loading','yellow',
            //          'Calgary Transit Access','orange',
            //          'yellow'] ,
            "line-width": scaledWidth(12),
            "line-offset": scaledWidth(15),
            "line-opacity": 0.7
          },
          filter:[
            "all",
              ["match",['get', 'sideOfStreet', ['get',"location"]],"right",true,false],
              // ["match",['get','activity',['get','rule',['get','regulations']]],"parking", true,false]
          ]
        });

      this.map.addLayer({
        "id": "Loading Class Left",
        "type": "line",
        "source": "Loading Curbs",
        "layout":{
          "visibility":"none"
        },
        "paint": {
          // "line-color": 'blue',
          "line-color": ['get', 'color'],
          // "line-color": ['match', ['get', 'class',['get','who',['get','restrictions']]],
          //          'Passenger Vehicle', '#4286f4',
          //          'Taxi', 'red',
          //          'Loading','green',
          //          'Calgary Transit Access','orange',
          //          'yellow'],
          "line-width": scaledWidth(12),
          "line-offset": scaledWidth(-15),
          "line-opacity": 0.7
        },
        filter:[
          "all",
            ["match",['get', 'sideOfStreet', ['get',"location"]],"left",true,false],
            // ["match",['get','activity',['get','rule',['get','regulations']]],"parking", true,false]
        ]
      });

      // this.map.addLayer({
      //     "id": "Parking Rate Right",
      //     "type": "line",
      //     "source": "Curbs",
      //     "layout":{
      //       "visibility":"none"
      //     },
      //     "paint": {
      //       "line-color": ["interpolate",
      //           ["linear"],
      //           ['*',['/',['get', 'rate',['get','payment',['get','restrictions']]] , ['number', ['get', 'interval',['get','payment',['get','restrictions']]], 1]],60],
      //           0,'#6105ff',
      //           3,'#ff780a',
      //           4.5,'#ffee00',
      //       ],
      //       "line-width": scaledWidth(12),
      //       "line-offset": scaledWidth(15),
      //       "line-opacity": 0.7
      //     },
      //     filter:["all",["match", ['get',"side"],"right",true,false],["match",['get', 'activity',['get','what',['get','restrictions']]],"park",true,false],["match",['get','class',['get','who',['get','restrictions']]],"Passenger Vehicle", true,false]]
      //   });

      //   this.map.addLayer({
      //       "id": "Parking Rate Left",
      //       "type": "line",
      //       "source": "Curbs",
      //       "layout":{
      //         "visibility":"none"
      //       },
      //       "paint": {
      //         "line-color": ["interpolate",
      //             ["linear"],
      //             ['*',['/',['get', 'rate',['get','payment',['get','restrictions']]] , ['number', ['get', 'interval',['get','payment',['get','restrictions']]], 1]],60],
      //             0,'#6105ff',
      //             3,'#ff780a',
      //             4.5,'#ffee00',
      //         ],
      //         "line-width": scaledWidth(12),
      //         "line-offset": scaledWidth(-15),
      //         "line-opacity": 0.7
      //       },
      //       filter:["all",["match", ['get',"side"],"left",true,false],["match",['get', 'activity',['get','what',['get','restrictions']]],"park", true,false],["match",['get','class',['get','who',['get','restrictions']]],"Passenger Vehicle", true,false]]
      //     });

        this.map.setLayoutProperty(this.state.SelectedView+" Right", 'visibility', 'visible');
        this.map.setLayoutProperty(this.state.SelectedView+" Left", 'visibility', 'visible');
        // this.map.setLayoutProperty("Parking Class Right", 'visibility', 'visible');
        // this.map.setLayoutProperty("Parking Class Left", 'visibility', 'visible');
    });
  }

  handleTimeChange(e) {
    e.preventDefault();
    this.setState({TimeValue:e.target.value}, () => {
      let geojson = 'https://pg7x2ae618.execute-api.us-west-2.amazonaws.com/dev/parking/rules?start='+this.state.TimeValue+'&day='+this.state.DayValue
      this.map.getSource('Curbs').setData(geojson)
    });
  }

  handleDayChange(e) {
    e.preventDefault();
    this.setState({DayValue:e.target.value}, () => {
      let geojson = 'https://pg7x2ae618.execute-api.us-west-2.amazonaws.com/dev/parking/rules?start='+this.state.TimeValue+'&day='+this.state.DayValue
      this.map.getSource('Curbs').setData(geojson)
    });
  }

  handleViewChange(e) {
    let previousState = this.state.SelectedView
    this.setState({SelectedView:e.target.value}, () => {
      this.map.setLayoutProperty(this.state.SelectedView+" Right", 'visibility', 'visible');
      this.map.setLayoutProperty(this.state.SelectedView+" Left", 'visibility', 'visible');
      this.map.setLayoutProperty(previousState+" Right", 'visibility', 'none');
      this.map.setLayoutProperty(previousState+" Left", 'visibility', 'none');
    });
  }

  render(){

    return(
      <div>
        <Helmet>
          <link href="https://api.mapbox.com/mapbox-assembly/v0.23.2/assembly.min.css" rel="stylesheet"/>
        </Helmet>

       <div ref={el => this.mapContainer = el} style={{position: 'absolute',top: 0, bottom: 0, width: '100%',height: '100%'}}/>
       <RulesContainer
         time={this.state.TimeValue}
         onTimeChange={this.handleTimeChange}
         day={this.state.DayValue}
         onDayChange={this.handleDayChange}
         view={this.state.SelectedView}
         onViewChange={this.handleViewChange}
         viewcontext={this.state.SelectedView}
       />
      </div>
    );
  }
}

export const query = graphql`
  query MyQuery {
    dataJson {
      features {
        type
        geometry {
          coordinates
          type
        }
        properties {
          location {
            sideOfStreet
            shstRefId
            shstLocationStart
            shstLocationEnd
          }
          regulations {
            priority
            userClasses {
              class
            }
            timeSpans {
              daysOfWeek {
                days
              }
              timesOfDay {
                from
                to
              }
            }
            rule {
              activity
              reason
            }
          }
        }
      }
    }
  }
`

export default CurbMap
