import React from 'react';
import './App.css';
import io from 'socket.io-client'
import Peer from 'simple-peer'
let url = 'https://cum-io.herokuapp.com/'
// let url = 'http://localhost:3000'


class App extends React.Component {

  constructor(props){
    super(props)
    this.client = {}
    this.socket = io(url)
    this.state = {users: 0}
    this.streamConstraints = {
      video: { width: window.innerWidth, height: window.innerHeight},
      audio: true
    }
  }
  
  

  componentDidMount() {
    let {client, socket} = this
    let video = document.querySelector('#main')
    navigator.mediaDevices.getUserMedia(this.streamConstraints)
      .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()

        // used to initialize a peer
        function InitPeer(type) {
          let peer = new Peer({ initiator: type === 'init' ? true : false, stream: stream, trickle: false })
          peer.on('stream', stream => {
            console.log('streaming')
            CreateVideo(stream)
          })
          peer.on('close', () => {
            document.getElementById('peerVideo').remove()
            peer.destroy()
          })
          return peer
        }

        // for peer of type init
        function MakePeer() {
          console.log('making peer')
          client.gotAnswer = false
          let peer = InitPeer('init')
          console.log(peer)
          peer.on('signal', data => {
            console.log(data)
            if (!client.gotAnswer) socket.emit('Offer', data)
          })
          client.peer = peer
        }

        // for peer of type not init
        function FrontAnswer(offer) {
          let peer = InitPeer('notInit')
          peer.on('signal', data => socket.emit('Answer', data))
          peer.signal(offer)
        }

        const SignalAnswer = (answer) => {
          client.gotAnswer = true
          let peer = client.peer
          peer.signal(answer)
        }

        function CreateVideo(stream) {
          console.log('create Video')
          let video = document.createElement('video')
          video.id = 'peerVideo'
          video.className = 'peer'
          video.srcObject = stream
          document.querySelector('#peer-container').appendChild(video)
          video.play()
        }

        function SessionActive() {
          document.write('Session Active. Please come back later')
        }

        const Disconnect = () => {
          console.log(client)
          console.log('disconnecting')
          let video = document.querySelector('#peerVideo')
          if(video) document.querySelector('#peer-container').removeChild(video)
        }


        socket.on('BackendOffer', FrontAnswer)
        socket.on('BackendAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', Disconnect)
      })
      .catch(err => document.write(err))
  }

  sendStream = (stream) => {
    this.socket.emit('stream', stream)
  }

  render(){
    return (
      <div className="App">
        <h1>Socket.io Chat App</h1>
        <p>Users active: {this.state.users}</p>
        <div id='peer-container'>
          <video id='main' muted></video>
        </div>
      </div>
    );
  }
}

export default App;
