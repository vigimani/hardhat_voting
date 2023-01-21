const { assert, expect, expectRevert, withNamedArgs } = require("chai")
const { network, deployments, ethers } = require("hardhat");
const { BN } = require('@openzeppelin/test-helpers');
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Units tests on addVoter and addProposal function", function () {
        let accounts;
        let vote;

        before(async() => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
        })
        
        //Test addVoter
        describe("addVoter success", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should addVoter if owner and correct WF status', async function () {
                await expect(vote.addVoter(accounts[1].address)).to.emit(
                vote,
                "VoterRegistered")  
            });
            it('should beRegistered if addVoter', async function () {
                await vote.addVoter(accounts[1].address)
                let x = await vote.connect(accounts[1]).getVoter(accounts[1].address)
                await assert(x.isRegistered === true)
            });
            it('should emit an event if addVoter', async function () {
                await expect(vote.addVoter(accounts[1].address)).to.emit(
                    vote,
                    "VoterRegistered"
                ).withArgs(accounts[1].address)
            });

        })
        describe("addVoter fail", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT addVoter if incorrect WF status', async function () {
                await vote.startProposalsRegistering()
                await expect(vote.addVoter(accounts[0].address)).to.be.revertedWith('Voters registration is not open yet')
                await vote.endProposalsRegistering()
                await expect(vote.addVoter(accounts[0].address)).to.be.revertedWith('Voters registration is not open yet')
                await vote.startVotingSession()
                await expect(vote.addVoter(accounts[0].address)).to.be.revertedWith('Voters registration is not open yet')
                await vote.endVotingSession()
                await expect(vote.addVoter(accounts[0].address)).to.be.revertedWith('Voters registration is not open yet')
                await vote.tallyVotes()
                await expect(vote.addVoter(accounts[0].address)).to.be.revertedWith('Voters registration is not open yet')

            });
            it('should NOT addVoter if not the owner', async function () {
                await expect(vote.connect(accounts[1]).addVoter(accounts[0].address)).to.be.revertedWith("Ownable: caller is not the owner")  
            });
        })
        //Test addProposal
        describe("addProposal fail", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT addProposal if incorrect WF status', async function () {
                await vote.addVoter(accounts[0].address)
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith('Proposals are not allowed yet')  
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith('Proposals are not allowed yet')  
                await vote.startVotingSession()
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith('Proposals are not allowed yet')  
                await vote.endVotingSession()
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith('Proposals are not allowed yet')  
                await vote.tallyVotes()
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith('Proposals are not allowed yet')  

            });
            it('should NOT addProposal if not a Voter', async function () {
                await vote.startProposalsRegistering()
                await expect(vote.addProposal("Proposal 0")).to.be.revertedWith("You're not a voter")  
            });
        })
        describe("addProposal success", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should emit event addProposal if Voter', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
        
                await expect(vote.connect(accounts[1]).addProposal("Proposal 0")).to.emit(
                    vote,
                    "ProposalRegistered"
                    )
            });
            it('should addProposal if Voter', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                let x = await vote.connect(accounts[1]).getOneProposal(1)
                await assert(x.description === "Proposal 0")
            });
            it('should add multiple Proposal if Voter', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.connect(accounts[1]).addProposal("Proposal 1")
                let x = await vote.connect(accounts[1]).getOneProposal(1)
                let y = await vote.connect(accounts[1]).getOneProposal(2)
                await assert(x.description === "Proposal 0")
                await assert(y.description === "Proposal 1")
            });
        })
        //Test setVote
        describe("setVote fail", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT setVote if incorrect WF status', async function () {
                await vote.addVoter(accounts[0].address)
                await expect(vote.setVote(1)).to.be.revertedWith('Voting session havent started yet')  
                await vote.startProposalsRegistering()
                await expect(vote.setVote(1)).to.be.revertedWith('Voting session havent started yet')  
                await vote.endProposalsRegistering()
                await expect(vote.setVote(1)).to.be.revertedWith('Voting session havent started yet')  
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.setVote(1)).to.be.revertedWith('Voting session havent started yet')  
                await vote.tallyVotes()
                await expect(vote.setVote(1)).to.be.revertedWith('Voting session havent started yet')  
            });
            it('should NOT setVote if not a Voter', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.connect(accounts[2]).setVote(1)).to.be.revertedWith("You're not a voter")  
            });
            it('should NOT setVote if already voted - same proposal vote', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.connect(accounts[1]).setVote(1)
                await expect(vote.connect(accounts[1]).setVote(1)).to.be.revertedWith('You have already voted') 
            });
            it('should NOT setVote if already voted - other proposal vote', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.addVoter(accounts[2].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.connect(accounts[2]).addProposal("Proposal 1")
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.connect(accounts[1]).setVote(1)
                await expect(vote.connect(accounts[1]).setVote(2)).to.be.revertedWith('You have already voted') 
            });
            it('should NOT setVote if no proposal', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.connect(accounts[1]).setVote(1)).to.be.revertedWith('Proposal not found') 
            });

        })
        describe("setVote success", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
                await vote.addVoter(accounts[1].address)
                await vote.addVoter(accounts[2].address)
                await vote.addVoter(accounts[3].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.connect(accounts[1]).addProposal("Proposal 1")
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
            })
            it('should setVote for a proposal done by someone else', async function () {
                await expect(vote.connect(accounts[3]).setVote(1)).to.emit(
                    vote,
                    "Voted"
                )  
            });
            it('should emit event setVote if Voter', async function () {
                await expect(vote.connect(accounts[1]).setVote(1)).to.emit(
                    vote,
                    "Voted"
                )  
            });
            it('should setVote even if no proposal done', async function () {
                await expect(vote.connect(accounts[3]).setVote(1)).to.emit(
                    vote,
                    "Voted"
                )  
            });
        })
        //Test tallyVotes
        describe("tallyVotes fail", function() {
            beforeEach(async() => {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT work if not votingSessionEnded', async function () {
                await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
            });
            it('should NOT work if not Owner', async function () {
                await vote.addVoter(accounts[1].address)
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.connect(accounts[1]).tallyVotes()).to.be.revertedWith("Ownable: caller is not the owner")
            });
        })
        describe ("tallyVotes special", function(){
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('if no Proposal', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.endVotingSession()
                await vote.tallyVotes()
                await expect(await vote.winningProposalID.call()).to.be.equal(0)
            });
        })
        describe("tallyVotes success", function() {
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
                await vote.addVoter(accounts[1].address)
                await vote.addVoter(accounts[2].address)
                await vote.addVoter(accounts[3].address)
                await vote.startProposalsRegistering()
                await vote.connect(accounts[1]).addProposal("Proposal 0")
                await vote.connect(accounts[1]).addProposal("Proposal 1")
                await vote.connect(accounts[3]).addProposal("Proposal 2")
                await vote.connect(accounts[3]).addProposal("Proposal 3")
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.connect(accounts[1]).setVote(1)
                await vote.connect(accounts[2]).setVote(4)
                await vote.connect(accounts[3]).setVote(4)
                await vote.endVotingSession()
            })
            it('should emit an event', async function () {
                await expect(vote.tallyVotes()).to.emit(
                    vote,
                    "WorkflowStatusChange"
                )  
            });
            it('should return the correct Proposal', async function () {
                await vote.tallyVotes()
                let y = await vote.winningProposalID.call()
                await assert(y.toString() === "4")
            });
        })
})