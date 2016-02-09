import {describe, before, it} from "mocha"
import expect from "expect.js"

import {Socket, LongPoll} from "../static/js/phoenix"


[{name: 'WebSocket', klass: window.WebSocket}, {name: 'LongPoll', klass: LongPoll}].forEach(item => {

  const {name, klass} = item

  describe(`integration:connect, ${name}`, function() {
    let socket = new Socket(`ws://phoenix-server.dev:4000/socket`, {transport: klass})
    socket.connect()

    // give older browsers plenty of time
    this.timeout(15000);

    it('can connect and send messages to one channel', (done) => {
      let lobby = socket.channel("rooms:lobby")

      lobby.on("new_msg", msg => {
        expect(msg, "Message events are sent").to.eql({body: "Elixir"})
      })

      lobby
        .join()
        .receive("ok", ({payload}) => {
          expect(payload, "A join payload was received").to.eql({nick: "abc"})

          lobby
            .push("new_msg", {body: "Elixir"})
            .receive("ok", msg => {
              expect(msg, "Message receive hook was called").to.eql({body: "Elixir"})
              done()
            })

        })
    })

    it('can connect and send messages to a second channel', (done) => {
      let bob = socket.channel("rooms:bob")

      bob.on("new_msg", msg => {
        expect(msg, "Message events are sent to the second channel").to.eql({body: "Hey!"})
      })

      bob
        .join()
        .receive("ok", ({payload}) => {
          expect(payload, "A join payload was received from second channel").to.eql({room: "bob"})

          bob
            .push("new_msg", {body: "Hey!"})
            .receive("ok", msg => {
              expect(msg, "Message receive hook was called on the second channel").to.eql({body: "Hey!"})
              done()
            })

        })
    })

  })
})

