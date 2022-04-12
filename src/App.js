import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [allWaves, setAllWaves] = useState([]);

    const [message, setMessage] = useState("");

    const contractAddress = "0x3e80F076a2374fD26b240cf65F73Ed3E5329d6ED";

    const contractABI = abi.abi;

    const network = window.ethereum.networkVersion;
    const [currNetwork, setNetwork] = useState(window.ethereum.networkVersion);

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                console.log("Make sure you have metamask!");
                return;
            } else {
                console.log("We have the ethereum object", ethereum);
            }

            const accounts = await ethereum.request({ method: "eth_accounts" });

            if (accounts.length !== 0) {
                const account = accounts[0];
                console.log("Found an authorized account:", account);
                setCurrentAccount(account);
                getAllWaves();
            } else {
                console.log("No authorized account found");
            }
        } catch (error) {
            console.log(error);
        }
    };

    /**
     * Implement your connectWallet method here
     */
    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }

            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });

            console.log("Connected", accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    };

    const wave = async () => {
        try {
            const { ethereum } = window;

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );

                let count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());

                /*
                 * Execute the actual wave from your smart contract
                 */
                const waveTxn = await wavePortalContract.wave(message, {
                    gasLimit: 300000,
                });
                console.log("Mining...", waveTxn.hash);

                await waveTxn.wait();
                console.log("Mined -- ", waveTxn.hash);

                count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getAllWaves = async () => {
        const { ethereum } = window;

        try {
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );
                const waves = await wavePortalContract.getAllWaves();

                const wavesCleaned = waves.map((wave) => {
                    return {
                        address: wave.waver,
                        timestamp: new Date(wave.timestamp * 1000),
                        message: wave.message,
                    };
                });

                setAllWaves(wavesCleaned);
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Listen in for emitter events!
    useEffect(() => {
        checkIfWalletIsConnected();
        let wavePortalContract;

        const onNewWave = (from, timestamp, message) => {
            console.log("NewWave", from, timestamp, message);
            setAllWaves((prevState) => [
                ...prevState,
                {
                    address: from,
                    timestamp: new Date(timestamp * 1000),
                    message: message,
                },
            ]);
        };

        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            wavePortalContract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            wavePortalContract.on("NewWave", onNewWave);
        }

        return () => {
            if (wavePortalContract) {
                wavePortalContract.off("NewWave", onNewWave);
            }
        };
    }, []);

    useEffect(() => {
        // If they don't have an connected wallet, exit!
        checkIfWalletIsConnected();

        const checkNetwork = async () => {
            try {
                if (network !== currNetwork) {
                    setNetwork(network);
                    console.log("Network changed to: " + network);
                } else {
                    setNetwork(network);
                }
            } catch (error) {
                console.error("Failed to get Network", error);
            }
        };

        checkNetwork();
    }, [network, currNetwork]);

    if (currNetwork !== "4") {
        return (
            <div className="unsupported-network">
                <h2>Please connect to Rinkeby</h2>
                <p>
                    This dapp only works on the Rinkeby network, please switch
                    networks in your connected wallet.
                </p>
            </div>
        );
    }

    return (
        <div className="mainContainer">
            <div className="dataContainer">
                <div className="header">👋 Hey there!</div>

                <div className="bio">
                    I am Habeeb and I am working on Web3 Development, that's
                    pretty impressive right? Connect your Ethereum wallet and
                    give me a wave!
                </div>
                <div className="bio">
                    (Ps. Please dont send more than one wave)
                </div>

                <textarea
                    rows="3"
                    onInput={(e) => setMessage(e.target.value)}
                    className="textbox"
                    defaultValue="Send me a message!"
                ></textarea>

                <button className="waveButton" onClick={wave}>
                    Wave at Me
                </button>

                {!currentAccount && (
                    <button className="waveButton" onClick={connectWallet}>
                        Connect Wallet
                    </button>
                )}

                {allWaves.map((wave, index) => {
                    return (
                        <div
                            key={index}
                            style={{
                                backgroundColor: "OldLace",
                                marginTop: "16px",
                                padding: "8px",
                            }}
                        >
                            <div>Address: {wave.address}</div>
                            <div>Time: {wave.timestamp.toString()}</div>
                            <div>Message: {wave.message}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default App;
