import { Kafka } from "kafkajs";
import { KAFKA_BROKER } from "./env.index.js";
import { KAFKA_NOTIFICATION_TOPIC } from "../utils/constants.js";
import { sendNotification } from "../configs/firebase.js";

const kafka = new Kafka({
  clientId: "goss-up",
  brokers: [KAFKA_BROKER],
});

let producer = null;

export const getProducer = async () => {
  if (producer) return producer;
  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;
  return producer;
};

export const produceNotification = async (topic, data) => {
  //data : { token, options, data } options: { title, body }
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(data),
      },
    ],
  });
};

export const startMessageConsumer = async () => {};

export const startNotificationConsumer = async () => {
  const consumer = kafka.consumer({ groupId: "notification-consumer" });
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_NOTIFICATION_TOPIC,
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ message, heartbeat }) => {
      const { tokens, options, data } = JSON.parse(message.value.toString());
      tokens.forEach(async(token) => await sendNotification(token.token, options, data));
      await heartbeat();
    },
  });
};

export default kafka;
