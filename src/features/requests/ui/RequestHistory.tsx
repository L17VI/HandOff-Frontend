import type { RequestHistoryEntry } from '../model/draft'
import { Icon } from '../../../shared/ui/Icon'

const historyTitles: Record<RequestHistoryEntry['kind'], string> = {
  submitted: 'Заявка отправлена',
  approved: 'Куратор одобрил заявку',
  received: 'Вы отметили получение',
  return_marked: 'Вы отметили возврат',
  returned: 'Сотрудник подтвердил возврат',
  cancelled: 'Вы отменили заявку',
  extension_requested: 'Вы запросили продление',
}

export function RequestHistory({ entries }: { entries: RequestHistoryEntry[] }) {
  return (
    <ol className="request-history">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${entry.kind}`}>
          <span
            className={`history-marker ${index === 0 ? 'is-latest' : ''}`}
            aria-hidden="true"
          >
            {index === 0 && <Icon name="check" />}
          </span>
          <div>
            <h3>{historyTitles[entry.kind]}</h3>
            <time dateTime={entry.at}>
              {new Intl.DateTimeFormat('ru', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(entry.at))}
            </time>
            {entry.note && <p>{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
