'use client';

interface UserDisplayProps {
  displayName: string | null;
}

export const UserDisplay = ({ displayName }: UserDisplayProps) => {
  if (!displayName) {
    return null;
  }

  return (
    <div className="card card--user card--user-desktop">
      <div className="container--centered">
        <p className="text--label">
          Playing as:
        </p>
        <p className="text--heading">
          {displayName}
        </p>
      </div>
    </div>
  );
}; 