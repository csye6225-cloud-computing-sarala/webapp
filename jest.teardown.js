import { statsdClient, closeStatsdClient } from "./src/config/statsd.js";

export default async () => {
  closeStatsdClient();
  statsdClient.socket.unref();
};
