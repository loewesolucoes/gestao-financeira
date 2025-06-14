import { useNotification } from "../contexts/notification"
import { use, useEffect, useState } from "react";
import { NotificationUtil } from "../utils/notification";
import Image from "next/image";
import { MarkdownUtils } from "../utils/markdown";

const basePath = process.env.BASE_PATH || ''

export function Notifications() {
  const { notifications } = useNotification();

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      {notifications.map((x, i) => (
        <NotificationItem key={i} item={x} />
      ))}
    </div>
  );
}

function NotificationItem({ item }) {
  const [show, setShow] = useState(true);
  const [parsedMessage, setParsedMessage] = useState<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => setShow(false), NotificationUtil.TIME_TO_CLOSE_NOTIFICATION);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    setParsedMessage(MarkdownUtils.render(item.message));
  }, [item]);

  return (
    <div className={`toast ${show && 'show'}`} role="alert" aria-live="assertive" aria-atomic="true">
      <div className="toast-header">
        <Image src={`${basePath}/favicon-16x16.png`} width={16} height={16} className="rounded me-2" alt="small logo size" />
        <strong className="me-auto">{process.env.NEXT_PUBLIC_TITLE}</strong>
        {/* <small className="text-body-secondary">just now</small> */}
        <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close" onClick={e => setShow(false)}></button>
      </div>
      <div className="toast-body" dangerouslySetInnerHTML={{ __html: parsedMessage }} />
    </div>
  );
}
