import HistoricalSubItem from "./HistoricalSubItem";

export default function HistoricalItem({ item, index }) {
  const collectivePrice = item.price;
  const collectiveSignature = item.signature.signature;
  const collectiveTimestamp = item.timestamp;

  const urls = item.urls;
  const signatures = item.signatures;
  const prices_returned = item.prices_returned;
  const timestamps = item.timestamps;

  const limit = timestamps.length;

  const items = [];
  for (let x = 0; x < limit; x++) {
    items.push(
      <>
        <HistoricalSubItem
          index={index}
          collectiveSignature={collectiveSignature}
          collectivePrice={collectivePrice}
          collectiveTimestamp={collectiveTimestamp}
          url={urls[x]}
          price_returned={prices_returned[x]}
          signature={signatures[x]}
          timestamp={timestamps[x]}
        />
      </>
    );
  }

  return <>{items ? items : null}</>;
}
