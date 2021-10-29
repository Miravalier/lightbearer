from os import name
import shelve
import aiohttp.web
import sys


shelf = shelve.open("/data/lighthouse.shelf", writeback=True)


class WebSocketApplication(aiohttp.web.Application):
    def __init__(self):
        super().__init__()
        self.router.add_get("/lighthouse", self.try_handle_connection)
        self.active_websockets = set()
        self.store = []

    async def try_handle_connection(self, request: aiohttp.web.Request):
        try:
            return await self.handle_connection(request)
        except Exception as e:
            print(f"{type(e).__name__}: {str(e)}")

    async def handle_connection(self, request: aiohttp.web.Request):
        # Upgrade to websocket
        websocket = aiohttp.web.WebSocketResponse()
        await websocket.prepare(request)
        self.active_websockets.add(websocket)
        # Iterate messages, forwarding them to other connected clients
        try:
            async for message in websocket:
                data = message.json()
                print("Received Message", data)
                # Send out this data to everyone on a broadcast type message
                if data["type"] in ("broadcast", "store-update"):
                    for other_websocket in self.active_websockets:
                        if websocket is other_websocket:
                            continue
                        await other_websocket.send_json(data)
                # Update the store in a store-update
                if data["type"] == "store-update":
                    # Get namespace
                    if data["namespace"] in shelf:
                        namespace = shelf[data["namespace"]]
                    else:
                        namespace = {}
                        shelf[data["namespace"]] = namespace
                    # Set key-value pair
                    namespace[data["key"]] = data["value"]
                    # Sync to disk
                    shelf.sync()
                # On store-sync request
                elif data["type"] == "store-sync":
                    # Get namespace
                    if data["namespace"] in shelf:
                        namespace = shelf[data["namespace"]]
                    else:
                        namespace = {}
                        shelf[data["namespace"]] = namespace
                    # Send key-value pairs back to the requester
                    await websocket.send_json(
                        {
                            "type": "store-sync",
                            "namespace": data["namespace"],
                            "data": namespace,
                        }
                    )
        finally:
            self.active_websockets.discard(websocket)


if __name__ == "__main__":
    server = WebSocketApplication()
    aiohttp.web.run_app(server, host="0.0.0.0", port=80)
    sys.exit(0)
