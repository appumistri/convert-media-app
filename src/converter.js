import react, { Component } from "react";
import { useBeforeunload } from 'react-beforeunload';
import Loader from 'react-loader';
import axios from "axios";
import { uuid } from 'uuidv4';
import config from "./config.json";
import React from "react";
import $ from '../node_modules/jquery/dist/jquery.min.js';

class Converter extends Component {

    state = {};

    constructor(props) {
        super(props);
        this.state = {
            converTo: 'mp4',
            baseUrl: config.baseUrl,
            isSocketConnected: false,
            isVideoProcessed: false,
            isVideoProcessing: false,
            downloadUrl: ''
        };

        this.fileInput = react.createRef();
        this.handleConverToChange = this.handleConverToChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleConverToChange = (event) => {
        this.setState({
            converTo: event.target.value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();

        const newState = this.state;
        newState.isVideoProcessing = true;
        this.setState(newState);

        let formData = new FormData();
        formData.append('media', this.fileInput.current.files[0]);
        formData.append('convertTo', this.state.converTo);
        formData.append('id', this.state.clientId);

        const conf = {
            headers: { 'content-type': 'multipart/form-data' }
        }

        const url = 'https://' + this.state.baseUrl + '/upload-media';
        axios.post(url, formData, conf)
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    const newState = this.state;
                    newState.isVideoProcessing = true;
                    newState.isVideoProcessed = false;
                    this.setState(newState);
                }
            })
            .catch(error => {
                console.log(error);
                const newState = this.state;
                newState.downloadUrl = event.data;
                newState.isVideoProcessed = false;
                newState.isVideoProcessing = false;
                this.setState(newState);
            });
    }

    componentDidMount() {

        const socket = new WebSocket('ws://' + config.baseUrl);
        const newState = this.state;
        newState.clientId = uuid();
        this.setState(newState);

        socket.addEventListener('open', (event) => {
            socket.send(this.state.clientId);

            setInterval(() => {
                socket.send(this.state.clientId);
            }, 30000);

            const newerState = this.state;
            newerState.isSocketConnected = true;
            this.setState(newerState);
        });

        socket.addEventListener('message', (event) => {
            console.log('Message from server ', event.data);
            const newerState = this.state;
            newerState.downloadUrl = event.data;
            newerState.isVideoProcessed = true;
            newerState.isVideoProcessing = false;
            this.setState(newerState);
            $('.toast').toast('show');
        });
    }

    render() {
        return (
            <Loader loaded={this.state.isSocketConnected || this.state.isVideoProcessing}>
                <div className={`card position-absolute top-50 start-50 translate-middle ${this.state.isVideoProcessing && this.state.isVideoProcessed ? "invisible" : ""}`}>
                    <header className="card-header">Video Converter</header>
                    <div className="card-body">
                        <form onSubmit={this.handleSubmit} method="post" className="form-inline" id="convert-video">
                            <div className="form-group pr-1">
                                <label htmlFor="media" className="form-label">Select a video file</label>
                                <input className="form-control" type="file" id="media" ref={this.fileInput} />
                            </div>
                            <div className="input-group mt-3">
                                <label className="input-group-text" htmlFor="convertTo">Convert To</label>
                                <select className="form-select" id="convertTo" value={this.state.converTo} onChange={this.handleConverToChange}>
                                    <option value="mp4">mp4</option>
                                    <option value="mov">mov</option>
                                    <option value="avi">avi</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <footer className="card-footer">
                        <button className="btn btn-primary btn-sm" type="submit" form="convert-video">Convert</button>
                    </footer>
                </div>
                <Loader loaded={!this.state.isVideoProcessing}>
                    <div className="toast" role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="toast-body">
                            Video conversion completed
                            <div className="mt-2 pt-2 border-top">
                                <a type="button" className="btn btn-primary btn-sm" href={this.state.downloadUrl}>Download</a>
                                <button type="button" className="btn btn-secondary btn-sm ms-2" data-bs-dismiss="toast">Close</button>
                            </div>
                        </div>
                    </div>
                </Loader>
            </Loader>
        );
    }
}

export default Converter;