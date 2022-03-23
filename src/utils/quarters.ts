type Date = number

function date (year: number, month: number, date: number): Date {
  return new Date(year, month - 1, date).getTime()
}

export type Quarter = {
  name: string
  start: Date
  finals: Date
  end: Date
}

/*
// Scraped from https://blink.ucsd.edu/instructors/resources/academic/calendars/2023.html
m = [, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October','November','December']
console.log([...document.querySelector('table.styled').textContent.matchAll(/(Fall|Winter|Spring|Summer Session I+) (\d{4})[^]+?Instruction begins\n.+?([A-Z][a-z]+) (\d+)[^]+?Final Exams\n.+?([A-Z][a-z]+) (\d+)[-–](\d+)/g)].map(([, season, year, startMonth, startDate, endMonth, finalsDate, endDate]) => `{ name: '${season.startsWith('Summer') ? 'S' + season.match(/I+/)[0].length : season.slice(0,2).toUpperCase()}${year.slice(-2)}', start: date(${year}, ${m.indexOf(startMonth)}, ${startDate}), finals: date(${year}, ${m.indexOf(endMonth)}, ${finalsDate}), end: date(${year}, ${m.indexOf(endMonth)}, ${endDate}) },`).join('\n'))
*/

export const quarters: Quarter[] = [
  {
    name: 'FA17',
    start: date(2017, 9, 28),
    finals: date(2017, 12, 9),
    end: date(2017, 12, 16)
  },
  {
    name: 'WI18',
    start: date(2018, 1, 8),
    finals: date(2018, 3, 17),
    end: date(2018, 3, 24)
  },
  {
    name: 'SP18',
    start: date(2018, 4, 2),
    finals: date(2018, 6, 9),
    end: date(2018, 6, 15)
  },
  {
    name: 'S118',
    start: date(2018, 7, 2),
    finals: date(2018, 8, 3),
    end: date(2018, 8, 4)
  },
  {
    name: 'S218',
    start: date(2018, 8, 6),
    finals: date(2018, 9, 7),
    end: date(2018, 9, 8)
  },
  {
    name: 'FA18',
    start: date(2018, 9, 27),
    finals: date(2018, 12, 8),
    end: date(2018, 12, 15)
  },
  {
    name: 'WI19',
    start: date(2019, 1, 7),
    finals: date(2019, 3, 16),
    end: date(2019, 3, 23)
  },
  {
    name: 'SP19',
    start: date(2019, 4, 1),
    finals: date(2019, 6, 8),
    end: date(2019, 6, 14)
  },
  {
    name: 'S119',
    start: date(2019, 7, 1),
    finals: date(2019, 8, 2),
    end: date(2019, 8, 3)
  },
  {
    name: 'S219',
    start: date(2019, 8, 5),
    finals: date(2019, 9, 6),
    end: date(2019, 9, 7)
  },
  {
    name: 'FA19',
    start: date(2019, 9, 26),
    finals: date(2019, 12, 7),
    end: date(2019, 12, 14)
  },
  {
    name: 'WI20',
    start: date(2020, 1, 6),
    finals: date(2020, 3, 14),
    end: date(2020, 3, 21)
  },
  {
    name: 'SP20',
    start: date(2020, 3, 30),
    finals: date(2020, 6, 6),
    end: date(2020, 6, 12)
  },
  {
    name: 'S120',
    start: date(2020, 6, 29),
    finals: date(2020, 7, 31),
    end: date(2020, 8, 1)
  },
  {
    name: 'S220',
    start: date(2020, 8, 3),
    finals: date(2020, 9, 4),
    end: date(2020, 9, 5)
  },
  {
    name: 'FA20',
    start: date(2020, 10, 1),
    finals: date(2020, 12, 12),
    end: date(2020, 12, 19)
  },
  {
    name: 'WI21',
    start: date(2021, 1, 4),
    finals: date(2021, 3, 13),
    end: date(2021, 3, 20)
  },
  {
    name: 'SP21',
    start: date(2021, 3, 29),
    finals: date(2021, 6, 5),
    end: date(2021, 6, 11)
  },
  {
    name: 'S121',
    start: date(2021, 6, 28),
    finals: date(2021, 7, 30),
    end: date(2021, 7, 31)
  },
  {
    name: 'S221',
    start: date(2021, 8, 2),
    finals: date(2021, 9, 3),
    end: date(2021, 9, 4)
  },
  {
    name: 'FA21',
    start: date(2021, 9, 20),
    finals: date(2021, 12, 4),
    end: date(2021, 12, 11)
  },
  {
    name: 'WI22',
    start: date(2022, 1, 3),
    finals: date(2022, 3, 12),
    end: date(2022, 3, 19)
  },
  {
    name: 'SP22',
    start: date(2022, 3, 28),
    finals: date(2022, 6, 4),
    end: date(2022, 6, 10)
  },
  {
    name: 'FA22',
    start: date(2022, 9, 22),
    finals: date(2022, 12, 3),
    end: date(2022, 12, 10)
  },
  {
    name: 'WI23',
    start: date(2023, 1, 9),
    finals: date(2023, 3, 18),
    end: date(2023, 3, 25)
  },
  {
    name: 'SP23',
    start: date(2023, 4, 3),
    finals: date(2023, 6, 10),
    end: date(2023, 6, 16)
  },
  {
    name: 'S123',
    start: date(2023, 7, 3),
    finals: date(2023, 8, 4),
    end: date(2023, 8, 5)
  },
  {
    name: 'S223',
    start: date(2023, 8, 7),
    finals: date(2023, 9, 8),
    end: date(2023, 9, 9)
  },
  {
    name: 'FA23',
    start: date(2023, 9, 28),
    finals: date(2023, 12, 9),
    end: date(2023, 12, 16)
  },
  {
    name: 'WI24',
    start: date(2024, 1, 8),
    finals: date(2024, 3, 16),
    end: date(2024, 3, 23)
  },
  {
    name: 'SP24',
    start: date(2024, 4, 1),
    finals: date(2024, 6, 8),
    end: date(2024, 6, 14)
  }
]
