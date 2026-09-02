import type { Standings } from '../../core/standings';

interface Props {
  standings: Standings;
  clubName: (clubId: string) => string;
  highlightClubId: string;
}

/**
 * Presentation only. The table arrives fully computed and ordered from the
 * league system via app/standingsQuery — this component never calculates
 * points, goal difference or positions.
 */
export function LeagueTable({ standings, clubName, highlightClubId }: Props) {
  return (
    <div className="tablewrap">
      <table data-testid="league-table">
        <thead>
          <tr>
            <th>#</th>
            <th>สโมสร</th>
            <th>ลง</th>
            <th>ช</th>
            <th>ส</th>
            <th>แพ้</th>
            <th>ได้</th>
            <th>เสีย</th>
            <th>+/-</th>
            <th>คะแนน</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.clubId}
              className={row.clubId === highlightClubId ? 'you' : ''}
              data-testid={row.clubId === highlightClubId ? 'my-row' : undefined}
            >
              <td>{row.position}</td>
              <td>{clubName(row.clubId)}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              <td data-testid={row.clubId === highlightClubId ? 'my-points' : undefined}>
                <b>{row.points}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
