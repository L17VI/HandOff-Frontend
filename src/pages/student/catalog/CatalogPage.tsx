import { useState } from 'react'
import { categories, equipmentMocks, filterEquipment, EquipmentCard, type Category } from '../../../features/equipment'
import { Icon } from '../../../shared/ui/Icon'
import { Modal } from '../../../shared/ui/Modal'
import catalogIllustration from '../../../shared/assets/illustrations/catalog.svg'

export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('Все')
  const [sector, setSector] = useState('')
  const [sort, setSort] = useState('available')
  const [startDate, setStartDate] = useState('2026-11-18')
  const [endDate, setEndDate] = useState('2026-11-20')
  const items = filterEquipment(equipmentMocks, query, category, sector, sort)
  const formatDate = (date: string) => new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))
  const dateLabel = startDate && endDate
    ? startDate.slice(0, 7) === endDate.slice(0, 7)
      ? `${Number(startDate.slice(-2))}–${formatDate(endDate)}`
      : `${formatDate(startDate)} – ${formatDate(endDate)}`
    : 'Выбрать даты'

  function clearFilters() {
    setQuery('')
    setCategory('Все')
    setSector('')
    setSort('available')
    setStartDate('')
    setEndDate('')
  }

  return <>
    <section className="catalog-intro" aria-labelledby="catalog-title">
      <div><h1 id="catalog-title">Каталог оборудования</h1><p>Найдите нужную вещь и проверьте, свободна ли она на ваши даты.</p></div>
      <img className="catalog-illustration" src={catalogIllustration} alt="" width="144" height="120" />
    </section>
    <section className="catalog-filters" aria-label="Фильтры оборудования">
      <div className="filter-row">
        <label className="search-control"><Icon name="search" /><span className="sr-only">Поиск по названию, разъёму или задаче</span><input type="search" placeholder="Поиск по названию, разъёму или задаче" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="select-control"><Icon name="pin" /><span className="sr-only">Место хранения</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option value="">Все места хранения</option><option value="А">Сектор А</option><option value="Б">Сектор Б</option><option value="В">Сектор В</option></select><Icon name="chevron" /></label>
        <Modal title="Даты бронирования" trigger={<><Icon name="sliders" /><span>{dateLabel}</span><Icon name="chevron" /></>} triggerClassName="date-control">
          <p className="muted">Выберите даты получения и возврата.</p>
          <div className="date-fields"><label>Получение<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label><label>Возврат<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label></div>
          <p className="muted">Выдачу и возврат согласует куратор.</p>
          <form method="dialog"><button className="primary-button">Готово</button></form>
        </Modal>
        <button type="button" className="clear-button" onClick={clearFilters}>Очистить</button>
      </div>
      <div className="category-list" aria-label="Категории">{categories.map((name) => <button key={name} type="button" className={`category-button ${category === name ? 'is-selected' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
    </section>
    <section className="equipment-section" aria-labelledby="equipment-heading">
      <div className="equipment-heading"><h2 id="equipment-heading">Оборудование</h2><label className="sort-control"><span className="sr-only">Сортировка оборудования</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="available">Сначала доступное</option><option value="name">По названию</option></select><Icon name="chevron" /></label></div>
      <span className="sr-only" role="status">Найдено: {items.length}</span>
      {items.length ? <div className="equipment-grid">{items.map((item) => <EquipmentCard key={item.id} item={item} />)}</div> : <div className="catalog-empty"><Icon name="search" /><h3>Ничего не нашлось</h3><p>Попробуйте другое название или сбросьте фильтры.</p><button className="clear-button" onClick={clearFilters}>Сбросить фильтры</button></div>}
    </section>
  </>
}
