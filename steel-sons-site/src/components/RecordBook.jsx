import React from 'react';

// This is the main RecordBook component.
export default function RecordBook() {

  // The records are now organized into categories for better structure and readability.
  // Records with multiple holders are now stored in an array within the object.
  const records = {
    seasonRecords: [
      {
        category: 'Most Points Per Game Scored in a Season',
        value: '129.47',
        holders: [{ team: 'Glen Halperin', year: '2013' }],
      },
      {
        category: 'Fewest Points Per Game Scored in a Season',
        value: '85.30*',
        holders: [{ team: 'Andrew David', year: '2023' }],
      },
      {
        category: 'Most Points Against Per Game in a Season',
        value: '124.13',
        holders: [{ team: 'Dylan Frank', year: '2021' }],
      },
      {
        category: 'Fewest Points Against Per Game in a Season',
        value: '88.90',
        holders: [{ team: 'Matt Nese', year: '2023' }],
      },
      {
        category: 'Most Wins in a Season',
        value: '13',
        holders: [{ team: 'Matt Hill', year: '2021' }],
      },
      {
        category: 'Fewest Wins in a Season',
        value: '2',
        holders: [
          { team: 'Stevie Woodrow', year: '2011' },
          { team: 'Andrew Stimmel', year: '2016' },
          { team: 'Ryan Walde', year: '2022' },
        ],
      },
      {
        category: 'Most Add/Drops in a Season',
        value: '77',
        holders: [{ team: 'Colin Scarola', year: '2020' }],
      },
      {
        category: 'Fewest Add/Drops in a Season',
        value: '4',
        holders: [{ team: 'Scott Zigarovich', year: '2024' }],
      },
      {
        category: 'Highest Total Point Differential',
        value: '392.80',
        holders: [{ team: 'Glen Halperin', year: '2013' }],
      },
      {
        category: 'Lowest Total Point Differential',
        value: '-307.90',
        holders: [{ team: 'Ian Very', year: '2014' }],
      },
      {
        category: 'Best Point Differential to Miss Playoffs',
        value: '127.12',
        holders: [{ team: 'Matt Nese', year: '2021' }],
      },
      {
        category: 'Worst Point Differential to Make Playoffs',
        value: '-154.38',
        holders: [{ team: 'Andrew David', year: '2023' }],
      },
      {
        category: 'Most Points Per Game For While Missing the Playoffs',
        value: '114.43',
        holders: [{ team: 'Colin Scarola', year: '2024' }],
      },
      {
        category: 'Fewest Points Per Game For While Making the Playoffs',
        value: '85.30',
        holders: [{ team: 'Andrew David', year: '2023' }],
      },
      {
        category: 'Most FAB Left At End of Season',
        value: '$100',
        holders: [{ team: 'Dylan Frank', year: '2020' }],
      },
      {
        category: 'Most Money Spent on a Free Agent',
        value: '$91*',
        holders: [{ team: 'Ryan Walde (DeVon Achane)', year: '2023' }],
      },
      {
        category: 'Most Money Spent on a Draft Pick',
        value: '$81',
        holders: [{ team: 'Curtis David (Christian McCaffrey)', year: '2020' }],
      },
    ],
    gameRecords: [
      {
        category: 'Fewest Points in a Win',
        value: '67.10',
        holders: [{ team: 'Carson Custer (over Matt Hill)', year: '2011 (Wk 5)' }],
      },
      {
        category: 'Most Points in a Loss',
        value: '153.70',
        holders: [{ team: 'Eric Hagen (loss to Andrew David)', year: '2015 (Wk 13)' }],
      },
      {
        category: 'Largest Margin of Victory',
        value: '94.41',
        holders: [{ team: 'Matt Nese (over Glen Halperin)', year: '2021 (Wk 8)' }],
      },
      {
        category: 'Smallest Margin of Victory',
        value: '0.02',
        holders: [{ team: 'Chris Fedishen (over Matt Nese)', year: '2021 (Wk 13)' }],
      },
    ],
    streakRecords: [
      {
        category: 'Longest Win Streak',
        value: '11',
        holders: [{ team: 'Ian Very', year: '2016' }],
      },
      {
        category: 'Longest Losing Streak',
        value: '9',
        holders: [
          { team: 'Cheese & Platz', year: '2021' },
          { team: 'Curtis David', year: '2024' },
        ],
      },
      {
        category: 'Consecutive Games Over 100 Points',
        value: '12',
        holders: [{ team: 'Ian Very', year: '2016' }],
      },
      {
        category: 'Consecutive Games Under 100 Points',
        value: '13',
        holders: [{ team: 'Andrew Simmel', year: '2016' }],
      },
      {
        category: 'Consecutive Seasons Making the Playoffs',
        value: '5',
        holders: [
          { team: 'Dylan Frank', year: '2012-2016' },
          { team: 'Greg Lim', year: '2017-2021' },
        ],
      },
      {
        category: 'Consecutive Seasons Missing the Playoffs',
        value: '5',
        holders: [
          { team: 'Glen Halperin', year: '2014-2018' },
          { team: 'Dylan Frank', year: '2017-2021' },
        ],
      },
      {
        category: 'Consecutive Seasons with a Losing Record',
        value: '5',
        holders: [{ team: 'Glen Halperin', year: '2014-2018' }],
      },
      {
        category: 'Consecutive Seasons .500 or Better',
        value: '5',
        holders: [{ team: 'Dylan Frank', year: '2011-2018' }],
      },
    ],
  };

  // Details for the highest single-week score.
  const highestSingleWeek = {
    team: 'Glen Halperin',
    year: '2020 (Wk 2)',
    players: [
      { pos: 'QB', name: 'Cam Newton', points: '34.58' },
      { pos: 'RB', name: 'Clyde Edwards-Helaire', points: '10.00' },
      { pos: 'RB', name: 'Aaron Jones', points: '43.60' },
      { pos: 'FLEX', name: 'DeAndre Hopkins', points: '16.80' },
      { pos: 'FLEX', name: 'DK Metcalf', points: '17.20' },
      { pos: 'WR', name: 'Marquise Brown', points: '6.70' },
      { pos: 'WR', name: 'Terry McLaurin', points: '22.00' },
      { pos: 'TE', name: 'Tyler Higbee', points: '25.90' },
      { pos: 'DEF', name: 'Ravens DST', points: '12.56' },
    ],
    total: '189.34',
  };

  // Details for the lowest single-week score with full lineup.
  const lowPointsSingleWeek = {
    team: 'Matt Nese',
    year: '2022 (Wk 14)',
    players: [
      { pos: 'QB', name: 'Kyler Murray', points: '0.66', notes: 'Injury on the 3rd snap' },
      { pos: 'RB', name: 'D\'Andre Swift', points: '5.40' },
      { pos: 'RB', name: 'Jeff Wilson Jr.', points: '2.60', notes: 'Injury, out by half' },
      { pos: 'FLEX', name: 'CeeDee Lamb', points: '5.80' },
      { pos: 'FLEX', name: 'Tee Higgins', points: '0.00', notes: 'Injured in warmups, played 1 snap' },
      { pos: 'WR', name: 'Chris Godwin', points: '7.90' },
      { pos: 'WR', name: 'Corey Davis', points: '2.00', notes: 'Injury, concussion by half' },
      { pos: 'TE', name: 'Greg Dulcich', points: '5.70' },
      { pos: 'DEF', name: 'Patriots DST', points: '13.82' },
    ],
    total: '43.88',
  };

  // Reusable component to render a record table.
  const RecordsTable = ({ title, recordsList }) => (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Name</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Value</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Manager</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recordsList.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.category}</td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.value}</td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {record.holders.map((holder, holderIndex) => (
                    <div key={holderIndex}>
                      {holder.team}
                    </div>
                  ))}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {record.holders.map((holder, holderIndex) => (
                    <div key={holderIndex}>
                      {holder.year}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 text-center leading-tight">Regular Season Record Book</h1>

        {/* Highlighted Records Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Highest Single Week */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              Highest Single Week Score: <span className="text-blue-600">{highestSingleWeek.total}</span>
            </h2>
            <p className="text-sm text-blue-700 mb-4">
              {highestSingleWeek.team}, {highestSingleWeek.year}
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200 bg-white rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">POS</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {highestSingleWeek.players.map((player, index) => (
                    <tr key={index} className="hover:bg-blue-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{player.pos}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.points}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="2" className="px-4 py-2 text-right text-sm text-blue-800">TOTAL</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-800">{highestSingleWeek.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Lowest Single Week */}
          <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl border border-red-200">
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Lowest Single Week Score: <span className="text-red-600">{lowPointsSingleWeek.total}</span>
            </h2>
            <p className="text-sm text-red-700 mb-4">
              {lowPointsSingleWeek.team}, {lowPointsSingleWeek.year}
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-red-200 bg-white rounded-lg">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-600 uppercase tracking-wider">POS</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-600 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-600 uppercase tracking-wider">Points</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-red-600 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {lowPointsSingleWeek.players.map((player, index) => (
                    <tr key={index} className="hover:bg-red-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{player.pos}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.points}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-700">{player.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-100 font-bold">
                    <td colSpan="3" className="px-4 py-2 text-right text-sm text-red-800">TOTAL</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-800">{lowPointsSingleWeek.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* General Records Tables */}
        <div className="space-y-8">
          <RecordsTable title="Single-Game Records" recordsList={records.gameRecords} />
          <RecordsTable title="Season-Long Records" recordsList={records.seasonRecords} />
          <RecordsTable title="Streak Records" recordsList={records.streakRecords} />
        </div>

        {/* Footnote for asterisk */}
        <p className="mt-8 text-center text-sm text-gray-500">*Indicates that the record has a specific note or condition attached.</p>
      </div>
    </div>
  );
}
