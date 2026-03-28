import { Link } from "wouter";

interface UsernameLinkProps {
  username: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders a username as a clickable link to the public profile page.
 * Use this anywhere a username is displayed (posts, messages, AARs, etc.)
 */
export function UsernameLink({ username, className = "", children }: UsernameLinkProps) {
  if (!username) return <span className={className}>{children ?? username}</span>;
  return (
    <Link href={`/u/${username}`}>
      <span className={`cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors ${className}`}>
        {children ?? username}
      </span>
    </Link>
  );
}
