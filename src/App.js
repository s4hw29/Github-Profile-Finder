import React, { useState, createContext, useContext, useEffect } from 'react';
import { useQueryClient, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FaMoon, FaSun } from 'react-icons/fa';
import './App.css';

const GithubContext = createContext();
const queryClient = new QueryClient();

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [username, setUsername] = useState('');
  const [searchedUsername, setSearchedUsername] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GithubContext.Provider value={{ theme, toggleTheme, username, setUsername, searchedUsername, setSearchedUsername }}>
        <div className={`App ${theme}`}>
          <div className="content-wrapper">
            <Header />
            <SearchBar />
            <UserProfile />
          </div>
        </div>
      </GithubContext.Provider>
    </QueryClientProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useContext(GithubContext);
  return (
    <header>
      <h1>devfinder</h1>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
}

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === 'light' ? 'DARK' : 'LIGHT'}
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </button>
  );
}

function SearchBar() {
  const { username, setUsername, setSearchedUsername } = useContext(GithubContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchedUsername(username);
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Search GitHub username..."
      />
      <button type="submit">Search</button>
    </form>
  );
}

function UserProfile() {
  const { searchedUsername } = useContext(GithubContext);

  const { isLoading, error, data } = useQuery({
    queryKey: ['githubUser', searchedUsername],
    queryFn: async () => {
      if (!searchedUsername) return null;
      const { data } = await axios.get(`https://api.github.com/users/${searchedUsername}`);
      return {
        name: data.name || data.login,
        username: `@${data.login}`,
        joinDate: `Joined ${new Date(data.created_at).toDateString()}`,
        bio: data.bio || 'This profile has no bio',
        repos: data.public_repos,
        followers: data.followers,
        following: data.following,
        location: data.location || 'Not Available',
        blog: data.blog || 'Not Available',
        twitter: data.twitter_username ? `@${data.twitter_username}` : 'Not Available',
        company: data.company || 'Not Available',
        avatar: data.avatar_url
      };
    },
    enabled: !!searchedUsername,
  });

  if (!searchedUsername) return null;
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="error">Error: {error.message}</p>;
  if (!data) return null;

  return (
    <div className="profile-card">
      <img src={data.avatar} alt={data.name} />
      <div className="profile-info">
        <h2>{data.name}</h2>
        <p>{data.username}</p>
        <p>{data.joinDate}</p>
      </div>
      <p className="bio">{data.bio}</p>
      <div className="stats">
        <div>
          <h3>Repos</h3>
          <p>{data.repos}</p>
        </div>
        <div>
          <h3>Followers</h3>
          <p>{data.followers}</p>
        </div>
        <div>
          <h3>Following</h3>
          <p>{data.following}</p>
        </div>
      </div>
      <div className="details">
        <p><img
          src="https://logodix.com/logo/37864.png"
          alt="location logo"
          className="externalLogo"
        />
          {data.location}</p>
        <p><img
          src="https://static.vecteezy.com/system/resources/previews/016/017/028/original/transparent-link-icon-free-png.png"
          alt="bloglogo"
          className="externalLogo"
        />
          {data.blog}</p>
        <p><img
          src="https://logos-world.net/wp-content/uploads/2020/04/Twitter-Logo.png"
          alt="twitterlogo"
          className="externalLogo"
        />
          {data.twitter}</p>
        <p><img
          src="https://images.vexels.com/media/users/3/145057/isolated/preview/40162fe877a9228c5cd5f28939af5a0e-office-building-silhouette-by-vexels.png"
          alt="organization logo"
          className="externalLogo"
        />
          {data.company}</p>
      </div>
    </div>
  );
}

export default App;
