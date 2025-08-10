import React from 'react';

export default function RecordBook() {
  // Data parsed from the provided image
  const regularSeasonRecords = [
    { category: 'Highest Single Week', value: '189.34', team: 'Glen Halperin', year: '2020 (Wk 2)' },
    { category: 'Lowest Single Week w/ Full Lineup Set', value: '43.88', team: 'Matt Nese', year: '2022 (Wk 14)' },
    { category: 'Longest Win Streak', value: '11', team: 'Ian Very', year: '2016' },
    { category: 'Longest Losing Streak', value: '9', team: 'Cheese & Platz', year: '2021' },
    { category: 'Most Points Game Scored in a Season', value: '129.47', team: 'Glen Halperin', year: '2013' },
    { category: 'Fewest Points Per Game Scored in a Season', value: '85.30*', team: 'Andrew David', year: '2023' },
    { category: 'Most Points Per Game Against in a Season', value: '124.13', team: 'Dylan Frank', year: '2021' },
    { category: 'Fewest Points Per Game Against in a Season', value: '88.90', team: 'Matt Nese', year: '2023' },
    { category: 'Most Wins in a Season', value: '13', team: 'Matt Hill', year: '2021' },
    { category: 'Fewest Wins in a Season', value: '2', team: 'Steevie Woodrow', year: '2011' },
    { category: '', value: '', team: 'Andrew Simmel', year: '2016' },
    { category: '', value: '', team: 'Ryan Valde', year: '2022' },
    { category: 'Consecutive Games Over 100 Points', value: '12', team: 'Ian Very', year: '2016' },
    { category: 'Consecutive Games Under 100 Points', value: '13', team: 'Andrew Simmel', year: '2016' },
    { category: 'Fewest Points in a Win', value: '67.10', team: 'Carson Custer (over Matt Hill)', year: '2011 (Wk 5)' },
    { category: 'Most Points in a Loss', value: '153.70', team: 'Eric Hagen (loss to Andrew David)', year: '2015 (Wk 13)' },
    { category: 'Largest Margin of Victory', value: '94.41', team: 'Matt Nese (over Glen Halperin)', year: '2021 (Wk 8)' },
    { category: 'Smallest Margin of Victory', value: '0.02', team: 'Chris Radish (over Matt Nese)', year: '2021 (Wk 13)' },
    { category: 'Consecutive Seasons Making the Playoffs', value: '5', team: 'Dylan Frank', year: '2012-2016' },
    { category: '', value: '', team: 'Greg Lin', year: '2017-2021' },
    { category: 'Consecutive Seasons Missing the Playoffs', value: '5', team: 'Glen Halperin', year: '2014-2018' },
    { category: '', value: '', team: 'Dylan Frank', year: '2017-2021' },
    { category: 'Consecutive Seasons .500 or Better', value: '8', team: 'Dylan Frank', year: '2011-2018' },
    { category: 'Consecutive Seasons with a Losing Record', value: '5', team: 'Glen Halperin', year: '2014-2018' },
    { category: 'Most FAB Left At End of Season', value: '100', team: 'Dylan Frank', year: '2020' },
    { category: 'Most Money Spent on a FA', value: '491*', team: 'Ryan Walde (DeVon Achane)', year: '2023' },
    { category: 'Most Money Spent on a Daft Pick', value: '181', team: 'Curtis David (Christian McCaffrey)', year: '2023' },
    { category: 'Most Add/Drops in a Season', value: '77', team: 'Colin Scarola', year: '2020' },
    { category: 'Fewest Add/Drops in a Season', value: '4', team: 'Scott Zigarovich', year: '2024' },
    { category: 'Most Points Per Game For While Missing the Playoffs', value: '114.43', team: 'Colin Scarola', year: '2024' },
    { category: 'Fewest Points Per Game For While Making the Playoff', value: '85.30', team: 'Andrew David', year: '2023' },
    { category: 'Highest Total Point Differential', value: '392.80', team: 'Glen Halperin', year: '2013' },
    { category: 'Lowest Total Point Differential', value: '-307.90', team: 'Ian Very', year: '2014' },
    { category: 'Best Point Differential to Miss Playoffs', value: '127.12', team: 'Matt Nese', year: '2021' },
    { category: 'Worst Point Differential to Make Playoffs', value: '-154.38', team: 'Andrew David', year: '2023' },
  ];

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

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto mt-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Regular Season Record Book</h2>

      {/* General Records Table */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8 text-center">General Records</h3>
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regularSeasonRecords.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.value}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.team}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Highest Single Week */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-700 mb-3">
          Highest Single Week Score: {highestSingleWeek.total}
          <span className="ml-2 text-base font-normal text-blue-600">
            ({highestSingleWeek.team}, {highestSingleWeek.year})
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">POS</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Player</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-200">
              {highestSingleWeek.players.map((player, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{player.pos}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.points}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td colSpan="2" className="px-4 py-2 text-right text-sm text-blue-800">TOTAL</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-800">{highestSingleWeek.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Points Single Week */}
      <div className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
        <h3 className="text-xl font-semibold text-red-700 mb-3">
          Lowest Single Week Score: {lowPointsSingleWeek.total}
          <span className="ml-2 text-base font-normal text-red-600">
            ({lowPointsSingleWeek.team}, {lowPointsSingleWeek.year})
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-red-200">
            <thead className="bg-red-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-600 uppercase tracking-wider">POS</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Player</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Points</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-red-200">
              {lowPointsSingleWeek.players.map((player, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{player.pos}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.points}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{player.notes || '-'}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold">
                <td colSpan="3" className="px-4 py-2 text-right text-sm text-red-800">TOTAL</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-red-800">{lowPointsSingleWeek.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
